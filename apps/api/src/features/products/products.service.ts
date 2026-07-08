import type { AccountKey, InsertProduct, Product } from "@api/db/schema";
import AccountsRepo from "@api/features/accounts/accounts.repo";
import CompaniesRepo from "@api/features/companies/companies.repo";
import { InventoryService, InventoryServiceError } from "@api/features/inventory/inventory.service";
import ProductsRepo from "@api/features/products/products.repo";
import type { CreateProductDto, CreateStockIntakeDto, ProductDto } from "@dto/products.dto";
import { Data, Effect, Option } from "effect";

export class ProductsService extends Effect.Service<ProductsService>()("ProductsService", {
  effect: Effect.gen(function* () {
    const accountsRepo = yield* AccountsRepo;
    const companiesRepo = yield* CompaniesRepo;
    const inventoryService = yield* InventoryService;
    const productsRepo = yield* ProductsRepo;

    function createForUser(input: CreateProductDto & { userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId: input.userId });

        if (!company) {
          return yield* Effect.fail(new ProductsServiceError({ code: "COMPANY_NOT_FOUND" }));
        }

        if (input.type === "service" && input.trackInventory) {
          return yield* Effect.fail(
            new ProductsServiceError({ code: "SERVICE_CANNOT_TRACK_STOCK" }),
          );
        }

        const productToInsert: InsertProduct = {
          companyId: company.id,
          name: input.name,
          type: input.type,
          defaultSalePrice: input.defaultSalePrice,
          trackInventory: input.type === "product" ? (input.trackInventory ?? false) : false,
          costMethod: "average_cost",
          isActive: input.isActive ?? true,
        };

        const product = yield* productsRepo
          .insert(productToInsert)
          .pipe(Effect.map(Option.getOrThrow));

        return toProductDto(product, null);
      });
    }

    function createStockIntakeForUser(
      input: CreateStockIntakeDto & { productId: number; userId: string },
    ) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId: input.userId });

        if (!company) {
          return yield* Effect.fail(new ProductsServiceError({ code: "COMPANY_NOT_FOUND" }));
        }

        const date = parseDate(input.date);

        if (!date) {
          return yield* Effect.fail(new ProductsServiceError({ code: "INVALID_DATE" }));
        }

        const companyAccounts = yield* accountsRepo.listByCompany({ companyId: company.id });
        const paymentAccount = companyAccounts.find(
          (account) => account.id === input.paymentAccountId,
        );

        if (!paymentAccount) {
          return yield* Effect.fail(new ProductsServiceError({ code: "INVALID_PAYMENT_ACCOUNT" }));
        }

        if (paymentAccount.key !== "cash" && paymentAccount.key !== "bank_checking") {
          return yield* Effect.fail(new ProductsServiceError({ code: "INVALID_PAYMENT_ACCOUNT" }));
        }

        const inventoryAccount = yield* getRequiredAccount(company.id, "inventory");
        const posted = yield* inventoryService
          .createStockIntake({
            companyId: company.id,
            productId: input.productId,
            quantity: input.quantity,
            unitCost: input.unitCost,
            date,
            inventoryAccountId: inventoryAccount.id,
            paymentAccountId: paymentAccount.id,
          })
          .pipe(
            Effect.mapError((err) =>
              err instanceof InventoryServiceError
                ? new ProductsServiceError({
                    accountId: err.accountId,
                    accountName: err.accountName,
                    code: err.code,
                    shortfall: err.shortfall,
                  })
                : err,
            ),
          );

        return {
          id: posted.movement.id,
          journalEntryId: posted.journalEntryId,
          stock: posted.stock,
        };
      });
    }

    function listForUser({ userId }: { userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new ProductsServiceError({ code: "COMPANY_NOT_FOUND" }));
        }

        const products = yield* productsRepo.listByCompany({ companyId: company.id });

        return yield* Effect.all(
          products.map((product) =>
            product.trackInventory
              ? inventoryService
                  .getCurrentStock({ companyId: company.id, productId: product.id })
                  .pipe(Effect.map((stock) => toProductDto(product, stock)))
              : Effect.succeed(toProductDto(product, null)),
          ),
        );
      });
    }

    function getRequiredAccount(companyId: number, key: AccountKey) {
      return accountsRepo
        .getByCompanyAndKey({ companyId, key })
        .pipe(
          Effect.flatMap((account) =>
            account
              ? Effect.succeed(account)
              : Effect.fail(new ProductsServiceError({ code: "MISSING_ACCOUNT" })),
          ),
        );
    }

    return { createForUser, createStockIntakeForUser, listForUser };
  }),

  accessors: true,
}) {}

function toProductDto(product: Product, stock: ProductDto["stock"]): ProductDto {
  return {
    id: product.id,
    name: product.name,
    type: product.type,
    defaultSalePrice: product.defaultSalePrice,
    trackInventory: product.trackInventory,
    costMethod: product.costMethod,
    isActive: product.isActive,
    stock,
  };
}

function parseDate(value: string) {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (!dateParts) return null;

  const [, yearValue, monthValue, dayValue] = dateParts;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export class ProductsServiceError extends Data.TaggedError("ProductsServiceError")<{
  readonly accountId?: number;
  readonly accountName?: string;
  readonly code:
    | "COMPANY_NOT_FOUND"
    | "INSUFFICIENT_BALANCE"
    | "INVALID_AMOUNT"
    | "INVALID_DATE"
    | "INVALID_PAYMENT_ACCOUNT"
    | "INVALID_QUANTITY"
    | "INVENTORY_NOT_TRACKED"
    | "MISSING_ACCOUNT"
    | "PRODUCT_NOT_FOUND"
    | "SERVICE_CANNOT_TRACK_STOCK";
  readonly shortfall?: string;
}> {}
