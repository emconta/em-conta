import {
  calculateStockIntakeTotalCost,
  calculateStockPosition,
} from "@api/features/inventory/inventory.service";
import { describe, expect, it } from "vitest";

describe("stock position calculation", () => {
  it("calculates quantity, total cost, and weighted average from purchases", () => {
    expect(
      calculateStockPosition([
        { quantity: "10.000", totalCost: "100.00", type: "purchase" },
        { quantity: "5.000", totalCost: "100.00", type: "purchase" },
      ]),
    ).toEqual({
      quantity: "15.000",
      totalCost: "200.00",
      averageUnitCost: "13.33",
    });
  });

  it("subtracts sale issues without recomputing historical costs", () => {
    expect(
      calculateStockPosition([
        { quantity: "10.000", totalCost: "100.00", type: "purchase" },
        { quantity: "2.000", totalCost: "20.00", type: "sale_issue" },
      ]),
    ).toEqual({
      quantity: "8.000",
      totalCost: "80.00",
      averageUnitCost: "10.00",
    });
  });

  it("rejects malformed movement values", () => {
    expect(
      calculateStockPosition([{ quantity: "1.0000", totalCost: "10.00", type: "purchase" }]),
    ).toBe("INVALID_STOCK_MOVEMENT");
  });

  it("exposes zero-rounded stock intake totals for rejection by the service", () => {
    expect(calculateStockIntakeTotalCost({ quantity: "0.001", unitCost: "0.01" })).toBe(0n);
  });
});
