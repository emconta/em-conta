import type { InsertStockMovement } from "@api/db/schema";
import ProductsRepo from "@api/features/products/products.repo";
import StockMovementsRepo from "@api/features/inventory/stockMovements.repo";
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
        let quantity = 0n;
        let totalCost = 0n;

        for (const movement of movements) {
          const movementQuantity = quantityToUnits(movement.quantity);
          const movementCost = moneyToCents(movement.totalCost);

          if (movementQuantity === null || movementCost === null) {
            return yield* Effect.fail(
              new InventoryServiceError({ code: "INVALID_STOCK_MOVEMENT" }),
            );
          }

          if (movement.type === "sale_issue") {
            quantity -= movementQuantity;
            totalCost -= movementCost;
          } else {
            quantity += movementQuantity;
            totalCost += movementCost;
          }
        }

        return toStockPosition(quantity, totalCost);
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

    function recordMovement(movement: InsertStockMovement) {
      return stockMovementsRepo.insert(movement);
    }

    return { getAverageCost, getCurrentStock, prepareSaleIssue, recordMovement };
  }),
}) {}

const QUANTITY_SCALE = 1000n;

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
    | "INVALID_STOCK_MOVEMENT"
    | "INVENTORY_NOT_TRACKED"
    | "NEGATIVE_STOCK"
    | "PRODUCT_NOT_FOUND";
}> {}
