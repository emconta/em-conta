import type { InsertStockMovement } from "@api/db/schema";
import StockMovementsRepo from "@api/features/inventory/stockMovements.repo";
import ProductsRepo from "@api/features/products/products.repo";
import { Data, Effect } from "effect";

export type StockPosition = {
  quantity: string;
  totalCost: string;
  averageUnitCost: string;
};

export type PrepareSaleIssueInput = {
  companyId: number;
  productId: number;
  quantity: string;
  date: Date;
  sourceId?: number | null;
};

export type CreateStockIntakeInput = {
  companyId: number;
  productId: number;
  quantity: string;
  unitCost: string;
  date: Date;
  inventoryAccountId: number;
  paymentAccountId: number;
};

export class InventoryService extends Effect.Service<InventoryService>()("InventoryService", {
  effect: Effect.gen(function* () {
    const productsRepo = yield* ProductsRepo;
    const stockMovementsRepo = yield* StockMovementsRepo;

    function getCurrentStock({ companyId, productId }: { companyId: number; productId: number }) {
      return Effect.gen(function* () {
        const movements = yield* stockMovementsRepo.listByCompanyAndProduct({
          companyId,
          productId,
        });
        const position = calculateStockPosition(movements);

        if (position === "INVALID_STOCK_MOVEMENT") {
          return yield* Effect.fail(new InventoryServiceError({ code: "INVALID_STOCK_MOVEMENT" }));
        }

        return position;
      });
    }

    function getAverageCost({ companyId, productId }: { companyId: number; productId: number }) {
      return getCurrentStock({ companyId, productId }).pipe(
        Effect.map((position) => position.averageUnitCost),
      );
    }

    function prepareSaleIssue(input: PrepareSaleIssueInput) {
      return Effect.gen(function* () {
        const product = yield* productsRepo.getByCompanyAndId({
          companyId: input.companyId,
          id: input.productId,
        });

        if (!product) {
          return yield* Effect.fail(new InventoryServiceError({ code: "PRODUCT_NOT_FOUND" }));
        }

        if (product.type !== "product" || !product.trackInventory) {
          return yield* Effect.fail(new InventoryServiceError({ code: "INVENTORY_NOT_TRACKED" }));
        }

        const issueQuantity = quantityToUnits(input.quantity);

        if (issueQuantity === null || issueQuantity <= 0n) {
          return yield* Effect.fail(new InventoryServiceError({ code: "INVALID_QUANTITY" }));
        }

        const current = yield* getCurrentStock({
          companyId: input.companyId,
          productId: input.productId,
        });
        const currentQuantity = quantityToUnits(current.quantity);
        const currentTotalCost = moneyToCents(current.totalCost);

        if (currentQuantity === null || currentTotalCost === null) {
          return yield* Effect.fail(new InventoryServiceError({ code: "INVALID_STOCK_MOVEMENT" }));
        }

        if (currentQuantity < issueQuantity) {
          return yield* Effect.fail(new InventoryServiceError({ code: "NEGATIVE_STOCK" }));
        }

        const totalCost = divideRound(currentTotalCost * issueQuantity, currentQuantity);
        const unitCost = divideRound(totalCost * QUANTITY_SCALE, issueQuantity);

        const movement: InsertStockMovement = {
          companyId: input.companyId,
          productId: input.productId,
          type: "sale_issue",
          quantity: unitsToQuantity(issueQuantity),
          unitCost: centsToMoney(unitCost),
          totalCost: centsToMoney(totalCost),
          date: input.date,
          sourceType: "sale",
          sourceId: input.sourceId ?? null,
        };

        return {
          movement,
          stockBefore: current,
        };
      });
    }

    function createStockIntake(input: CreateStockIntakeInput) {
      return Effect.gen(function* () {
        const product = yield* productsRepo.getByCompanyAndId({
          companyId: input.companyId,
          id: input.productId,
        });

        if (!product) {
          return yield* Effect.fail(new InventoryServiceError({ code: "PRODUCT_NOT_FOUND" }));
        }

        if (product.type !== "product" || !product.trackInventory) {
          return yield* Effect.fail(new InventoryServiceError({ code: "INVENTORY_NOT_TRACKED" }));
        }

        const quantity = quantityToUnits(input.quantity);
        const unitCost = moneyToCents(input.unitCost);

        if (quantity === null || quantity <= 0n) {
          return yield* Effect.fail(new InventoryServiceError({ code: "INVALID_QUANTITY" }));
        }

        if (unitCost === null || unitCost <= 0n) {
          return yield* Effect.fail(new InventoryServiceError({ code: "INVALID_AMOUNT" }));
        }

        const totalCost = calculateStockIntakeTotalCost({ quantity: input.quantity, unitCost: input.unitCost });

        if (totalCost === null || totalCost <= 0n) {
          return yield* Effect.fail(new InventoryServiceError({ code: "INVALID_AMOUNT" }));
        }

        const amount = centsToMoney(totalCost);

        const posted = yield* stockMovementsRepo.createStockIntake({
          movement: {
            companyId: input.companyId,
            productId: product.id,
            type: "purchase",
            quantity: unitsToQuantity(quantity),
            unitCost: centsToMoney(unitCost),
            totalCost: amount,
            date: input.date,
            sourceType: "purchase",
          },
          journalEntry: {
            companyId: input.companyId,
            sourceType: "purchase",
            entryDate: input.date,
            memo: `Stock intake: ${product.name}`,
            status: "posted",
            lines: [
              { accountId: input.inventoryAccountId, type: "debit", amount },
              { accountId: input.paymentAccountId, type: "credit", amount },
            ],
          },
        });

        const stock = yield* getCurrentStock({ companyId: input.companyId, productId: product.id });

        return { journalEntryId: posted.entry.id, movement: posted.movement, stock };
      });
    }

    function recordMovement(movement: InsertStockMovement) {
      return stockMovementsRepo.insert(movement);
    }

    return { createStockIntake, getAverageCost, getCurrentStock, prepareSaleIssue, recordMovement };
  }),
}) {}

const QUANTITY_SCALE = 1000n;

export function calculateStockPosition(
  movements: Pick<InsertStockMovement, "quantity" | "totalCost" | "type">[],
) {
  let quantity = 0n;
  let totalCost = 0n;

  for (const movement of movements) {
    const movementQuantity = quantityToUnits(movement.quantity);
    const movementCost = moneyToCents(movement.totalCost);

    if (movementQuantity === null || movementCost === null) return "INVALID_STOCK_MOVEMENT" as const;

    if (movement.type === "sale_issue") {
      quantity -= movementQuantity;
      totalCost -= movementCost;
    } else {
      quantity += movementQuantity;
      totalCost += movementCost;
    }
  }

  return toStockPosition(quantity, totalCost);
}

export function calculateStockIntakeTotalCost({
  quantity,
  unitCost,
}: {
  quantity: string;
  unitCost: string;
}) {
  const quantityUnits = quantityToUnits(quantity);
  const unitCostCents = moneyToCents(unitCost);

  if (quantityUnits === null || unitCostCents === null) return null;

  return divideRound(unitCostCents * quantityUnits, QUANTITY_SCALE);
}

function toStockPosition(quantity: bigint, totalCost: bigint): StockPosition {
  const averageUnitCost = quantity > 0n ? divideRound(totalCost * QUANTITY_SCALE, quantity) : 0n;

  return {
    quantity: unitsToQuantity(quantity),
    totalCost: centsToMoney(totalCost),
    averageUnitCost: centsToMoney(averageUnitCost),
  };
}

function quantityToUnits(quantity: string) {
  if (!/^-?\d+(\.\d{1,3})?$/.test(quantity)) return null;

  const sign = quantity.startsWith("-") ? -1n : 1n;
  const absolute = quantity.replace("-", "");
  const [units = "0", decimals = ""] = absolute.split(".");

  return sign * (BigInt(units) * QUANTITY_SCALE + BigInt(decimals.padEnd(3, "0")));
}

function moneyToCents(amount: string) {
  if (!/^-?\d+(\.\d{1,2})?$/.test(amount)) return null;

  const sign = amount.startsWith("-") ? -1n : 1n;
  const absolute = amount.replace("-", "");
  const [units = "0", cents = ""] = absolute.split(".");

  return sign * (BigInt(units) * 100n + BigInt(cents.padEnd(2, "0")));
}

function unitsToQuantity(units: bigint) {
  return formatDecimal(units, 3);
}

function centsToMoney(cents: bigint) {
  return formatDecimal(cents, 2);
}

function formatDecimal(value: bigint, scale: number) {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const divisor = 10n ** BigInt(scale);
  const units = absolute / divisor;
  const decimals = (absolute % divisor).toString().padStart(scale, "0");

  return `${sign}${units}.${decimals}`;
}

function divideRound(numerator: bigint, denominator: bigint) {
  return (numerator + denominator / 2n) / denominator;
}

export class InventoryServiceError extends Data.TaggedError("InventoryServiceError")<{
  readonly code:
    | "INVALID_QUANTITY"
    | "INVALID_AMOUNT"
    | "INVALID_STOCK_MOVEMENT"
    | "INVENTORY_NOT_TRACKED"
    | "NEGATIVE_STOCK"
    | "PRODUCT_NOT_FOUND";
}> {}
