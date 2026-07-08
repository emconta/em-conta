import type {
  Account,
  InsertJournalEntryLine,
  InsertSale,
  InsertSaleItem,
  InsertStockMovement,
  SaleKind,
  SalePaymentTerms,
  Sale,
  SaleItem,
} from "@api/db/schema";
import { isCashOrBankType } from "@api/features/accounts/accountTypes";
import type { AccountType } from "@api/features/accounts/accountTypes";
import AccountsRepo from "@api/features/accounts/accounts.repo";
import CompaniesRepo from "@api/features/companies/companies.repo";
import { InventoryService, InventoryServiceError } from "@api/features/inventory/inventory.service";
import ProductsRepo from "@api/features/products/products.repo";
import SalesRepo, { type PostedSaleJournalEntry } from "@api/features/sales/sales.repo";
import type { CreateSaleDto, SaleDetailDto, SaleItemDto, SaleListItemDto } from "@dto/sales.dto";
import { Data, Effect } from "effect";

export type CreateSaleInput = {
  companyId: number;
  paymentTerms: SalePaymentTerms;
  issueDate: Date;
  description?: string | null;
  customerName?: string | null;
  cashAccountId?: number;
  discountAmount?: string;
  items: CreateSaleItemInput[];
};

export type CreateSaleItemInput = {
  productId: number;
  quantity: string;
  unitPrice?: string;
  description?: string | null;
};

export class SalesService extends Effect.Service<SalesService>()("SalesService", {
  effect: Effect.gen(function* () {
    const accountsRepo = yield* AccountsRepo;
    const companiesRepo = yield* CompaniesRepo;
    const inventoryService = yield* InventoryService;
    const productsRepo = yield* ProductsRepo;
    const salesRepo = yield* SalesRepo;

    function create(input: CreateSaleInput) {
      return Effect.gen(function* () {
        if (input.items.length === 0) {
          return yield* Effect.fail(new CreateSaleError({ code: "EMPTY_ITEMS" }));
        }

        const discountAmount = moneyToCents(input.discountAmount ?? "0.00");

        if (discountAmount === null || discountAmount !== 0n) {
          return yield* Effect.fail(new CreateSaleError({ code: "UNSUPPORTED_DISCOUNT" }));
        }

        const companyAccounts = yield* accountsRepo.listByCompany({ companyId: input.companyId });
        const receivingAccount = yield* resolveReceivingAccount(input, companyAccounts);
        const accountsReceivable =
          input.paymentTerms === "credit"
            ? yield* getRequiredAccount(input.companyId, "accounts_receivable")
            : null;
        const salesRevenue = yield* getRequiredAccount(input.companyId, "sales_revenue");
        const servicesRevenue = yield* getRequiredAccount(input.companyId, "services_revenue");
        const inventoryAccount = yield* getRequiredAccount(input.companyId, "inventory");
        const cogsAccount = yield* getRequiredAccount(input.companyId, "cogs");

        const preparedItems: Omit<InsertSaleItem, "saleId">[] = [];
        const stockMovements: Omit<InsertStockMovement, "sourceId">[] = [];
        let productRevenue = 0n;
        let serviceRevenue = 0n;
        let totalCost = 0n;
        let hasProduct = false;
        let hasService = false;

        for (const item of input.items) {
          const product = yield* productsRepo.getByCompanyAndId({
            companyId: input.companyId,
            id: item.productId,
          });

          if (!product?.isActive) {
            return yield* Effect.fail(new CreateSaleError({ code: "PRODUCT_NOT_FOUND" }));
          }

          const quantity = quantityToUnits(item.quantity);
          const unitPrice = moneyToCents(item.unitPrice ?? product.defaultSalePrice);

          if (quantity === null || quantity <= 0n) {
            return yield* Effect.fail(new CreateSaleError({ code: "INVALID_QUANTITY" }));
          }

          if (unitPrice === null || unitPrice <= 0n) {
            return yield* Effect.fail(new CreateSaleError({ code: "INVALID_AMOUNT" }));
          }

          const lineAmount = divideRound(unitPrice * quantity, QUANTITY_SCALE);
          let unitCostSnapshot: string | null = null;
          let lineCostAmount: string | null = null;

          if (product.type === "product") {
            hasProduct = true;
            productRevenue += lineAmount;

            if (product.trackInventory) {
              const saleIssue = yield* inventoryService
                .prepareSaleIssue({
                  companyId: input.companyId,
                  productId: product.id,
                  quantity: item.quantity,
                  date: input.issueDate,
                })
                .pipe(
                  Effect.mapError((err) =>
                    err instanceof InventoryServiceError
                      ? new CreateSaleError({ code: err.code })
                      : err,
                  ),
                );
              const cost = moneyToCents(saleIssue.movement.totalCost);

              if (cost === null) {
                return yield* Effect.fail(new CreateSaleError({ code: "INVALID_AMOUNT" }));
              }

              totalCost += cost;
              unitCostSnapshot = saleIssue.movement.unitCost;
              lineCostAmount = saleIssue.movement.totalCost;
              stockMovements.push(saleIssue.movement);
            }
          } else {
            hasService = true;
            serviceRevenue += lineAmount;
          }

          preparedItems.push({
            productId: product.id,
            description: item.description ?? product.name,
            type: product.type,
            quantity: unitsToQuantity(quantity),
            unitPrice: centsToMoney(unitPrice),
            lineAmount: centsToMoney(lineAmount),
            unitCostSnapshot,
            lineCostAmount,
          });
        }

        const grossAmount = productRevenue + serviceRevenue;
        const sale: InsertSale = {
          companyId: input.companyId,
          kind: saleKind({ hasProduct, hasService }),
          paymentTerms: input.paymentTerms,
          issueDate: input.issueDate,
          description: input.description ?? null,
          customerName: input.customerName ?? null,
          grossAmount: centsToMoney(grossAmount),
          discountAmount: centsToMoney(discountAmount),
          netAmount: centsToMoney(grossAmount - discountAmount),
          status: "posted",
        };

        const debitAccount = input.paymentTerms === "cash" ? receivingAccount : accountsReceivable;

        if (!debitAccount) {
          return yield* Effect.fail(new CreateSaleError({ code: "MISSING_ACCOUNT" }));
        }

        const revenueEntry: Omit<PostedSaleJournalEntry, "sourceId"> = {
          companyId: input.companyId,
          sourceType: "sale",
          entryDate: input.issueDate,
          memo: input.description ?? "Receita de venda",
          status: "posted",
          lines: compactLines([
            { accountId: debitAccount.id, type: "debit", amount: centsToMoney(grossAmount) },
            productRevenue > 0n
              ? { accountId: salesRevenue.id, type: "credit", amount: centsToMoney(productRevenue) }
              : null,
            serviceRevenue > 0n
              ? {
                  accountId: servicesRevenue.id,
                  type: "credit",
                  amount: centsToMoney(serviceRevenue),
                }
              : null,
          ]),
        };

        const stockEntry: Omit<PostedSaleJournalEntry, "sourceId"> | undefined =
          totalCost > 0n
            ? {
                companyId: input.companyId,
                sourceType: "stock_issue",
                entryDate: input.issueDate,
                memo: input.description ?? "Baixa de estoque da venda",
                status: "posted",
                lines: [
                  { accountId: cogsAccount.id, type: "debit", amount: centsToMoney(totalCost) },
                  {
                    accountId: inventoryAccount.id,
                    type: "credit",
                    amount: centsToMoney(totalCost),
                  },
                ],
              }
            : undefined;

        const posted = yield* salesRepo.createPostedSale({
          sale,
          items: preparedItems,
          revenueEntry,
          stockMovements,
          stockEntry,
        });

        return {
          saleId: posted.sale.id,
          journalEntryIds: [
            posted.revenueEntry.entry.id,
            ...(posted.stockEntry ? [posted.stockEntry.entry.id] : []),
          ],
        };
      });
    }

    function createForUser(input: CreateSaleDto & { userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId: input.userId });

        if (!company) {
          return yield* Effect.fail(new CreateSaleError({ code: "COMPANY_NOT_FOUND" }));
        }

        const issueDate = parseDate(input.issueDate);

        if (!issueDate) {
          return yield* Effect.fail(new CreateSaleError({ code: "INVALID_DATE" }));
        }

        return yield* create({
          companyId: company.id,
          paymentTerms: input.paymentTerms,
          issueDate,
          description: input.description ?? null,
          customerName: input.customerName ?? null,
          cashAccountId: input.cashAccountId,
          discountAmount: input.discountAmount,
          items: input.items,
        });
      });
    }

    function listForUser({ userId }: { userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new ReadSaleError({ code: "COMPANY_NOT_FOUND" }));
        }

        const sales = yield* salesRepo.listByCompany({ companyId: company.id });

        return sales
          .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime())
          .map(toSaleListItemDto);
      });
    }

    function getForUser({ id, userId }: { id: number; userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new ReadSaleError({ code: "COMPANY_NOT_FOUND" }));
        }

        const sale = yield* salesRepo.getByCompanyAndId({ companyId: company.id, id });

        if (!sale) {
          return yield* Effect.fail(new ReadSaleError({ code: "SALE_NOT_FOUND" }));
        }

        const items = yield* salesRepo.listItemsBySale({ saleId: sale.id });

        return {
          ...toSaleListItemDto(sale),
          items: items.map(toSaleItemDto),
        } satisfies SaleDetailDto;
      });
    }

    function getRequiredAccount(companyId: number, type: AccountType) {
      return accountsRepo
        .getByCompanyAndType({ companyId, type })
        .pipe(
          Effect.flatMap((account) =>
            account
              ? Effect.succeed(account)
              : Effect.fail(new CreateSaleError({ code: "MISSING_ACCOUNT" })),
          ),
        );
    }

    return { create, createForUser, getForUser, listForUser };
  }),

  accessors: true,
}) {}

function parseDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function toSaleListItemDto(sale: Sale): SaleListItemDto {
  return {
    id: sale.id,
    kind: sale.kind,
    paymentTerms: sale.paymentTerms,
    issueDate: sale.issueDate.toISOString(),
    description: sale.description,
    customerName: sale.customerName,
    grossAmount: sale.grossAmount,
    discountAmount: sale.discountAmount,
    netAmount: sale.netAmount,
    status: sale.status,
  };
}

function toSaleItemDto(item: SaleItem): SaleItemDto {
  return {
    id: item.id,
    productId: item.productId,
    description: item.description,
    type: item.type,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineAmount: item.lineAmount,
    unitCostSnapshot: item.unitCostSnapshot,
    lineCostAmount: item.lineCostAmount,
  };
}

function resolveReceivingAccount(input: CreateSaleInput, companyAccounts: Account[]) {
  return Effect.gen(function* () {
    if (input.paymentTerms === "credit") return null;

    if (!input.cashAccountId) {
      return yield* Effect.fail(new CreateSaleError({ code: "MISSING_CASH_ACCOUNT" }));
    }

    const account = companyAccounts.find((candidate) => candidate.id === input.cashAccountId);

    if (!account || !isCashOrBankType(account.type)) {
      return yield* Effect.fail(new CreateSaleError({ code: "INVALID_CASH_ACCOUNT" }));
    }

    return account;
  });
}

function saleKind({
  hasProduct,
  hasService,
}: {
  hasProduct: boolean;
  hasService: boolean;
}): SaleKind {
  if (hasProduct && hasService) return "mixed";
  if (hasProduct) return "product";
  return "service";
}

function compactLines(
  lines: (Omit<InsertJournalEntryLine, "entryId"> | null)[],
): Omit<InsertJournalEntryLine, "entryId">[] {
  return lines.filter((line): line is Omit<InsertJournalEntryLine, "entryId"> => line !== null);
}

const QUANTITY_SCALE = 1000n;

function quantityToUnits(quantity: string) {
  if (!/^\d+(\.\d{1,3})?$/.test(quantity)) return null;

  const [units = "0", decimals = ""] = quantity.split(".");

  return BigInt(units) * QUANTITY_SCALE + BigInt(decimals.padEnd(3, "0"));
}

function moneyToCents(amount: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) return null;

  const [units = "0", cents = ""] = amount.split(".");

  return BigInt(units) * 100n + BigInt(cents.padEnd(2, "0"));
}

function unitsToQuantity(units: bigint) {
  return formatDecimal(units, 3);
}

function centsToMoney(cents: bigint) {
  return formatDecimal(cents, 2);
}

function formatDecimal(value: bigint, scale: number) {
  const divisor = 10n ** BigInt(scale);
  const units = value / divisor;
  const decimals = (value % divisor).toString().padStart(scale, "0");

  return `${units}.${decimals}`;
}

function divideRound(numerator: bigint, denominator: bigint) {
  return (numerator + denominator / 2n) / denominator;
}

export class CreateSaleError extends Data.TaggedError("CreateSaleError")<{
  readonly code:
    | "COMPANY_NOT_FOUND"
    | "EMPTY_ITEMS"
    | "INVALID_AMOUNT"
    | "INVALID_CASH_ACCOUNT"
    | "INVALID_DATE"
    | "INVALID_QUANTITY"
    | "INVALID_STOCK_MOVEMENT"
    | "INVENTORY_NOT_TRACKED"
    | "MISSING_ACCOUNT"
    | "MISSING_CASH_ACCOUNT"
    | "NEGATIVE_STOCK"
    | "PRODUCT_NOT_FOUND"
    | "UNSUPPORTED_DISCOUNT"
    | "INSUFFICIENT_BALANCE";
}> {}

export class ReadSaleError extends Data.TaggedError("ReadSaleError")<{
  readonly code: "COMPANY_NOT_FOUND" | "SALE_NOT_FOUND";
}> {}
