import { computeCashBankCredits } from "@api/features/balance/balanceGuard.service";
import { describe, expect, it } from "vitest";

function makeAccount(id: number, type: string) {
  return { id, type };
}

describe("computeCashBankCredits", () => {
  it("returns empty map when no credit lines target cash/bank accounts", () => {
    const accountsById = new Map([
      [1, makeAccount(1, "cash")],
      [2, makeAccount(2, "sales_revenue")],
    ]);

    const result = computeCashBankCredits(
      [
        { accountId: 2, type: "credit", amount: "500.00" },
        { accountId: 1, type: "debit", amount: "500.00" },
      ],
      accountsById,
    );

    expect(result.size).toBe(0);
  });

  it("collects credit lines targeting cash account", () => {
    const accountsById = new Map([
      [1, makeAccount(1, "cash")],
      [2, makeAccount(2, "accounts_payable")],
    ]);

    const result = computeCashBankCredits(
      [
        { accountId: 1, type: "credit", amount: "300.00" },
        { accountId: 1, type: "credit", amount: "200.00" },
      ],
      accountsById,
    );

    expect(result.get(1)).toBe(50000n);
  });

  it("collects credit lines targeting bank_checking account", () => {
    const accountsById = new Map([[1, makeAccount(1, "bank_checking")]]);

    const result = computeCashBankCredits(
      [{ accountId: 1, type: "credit", amount: "1000.00" }],
      accountsById,
    );

    expect(result.get(1)).toBe(100000n);
  });

  it("ignores unknown account IDs", () => {
    const accountsById = new Map<number, { id: number; type: string }>();

    const result = computeCashBankCredits(
      [{ accountId: 99, type: "credit", amount: "100.00" }],
      accountsById,
    );

    expect(result.size).toBe(0);
  });

  it("ignores non-cash/bank accounts even if they are credited", () => {
    const accountsById = new Map([[1, makeAccount(1, "accounts_payable")]]);

    const result = computeCashBankCredits(
      [{ accountId: 1, type: "credit", amount: "100.00" }],
      accountsById,
    );

    expect(result.size).toBe(0);
  });

  it("separates credits by account", () => {
    const accountsById = new Map([
      [1, makeAccount(1, "cash")],
      [2, makeAccount(2, "bank_checking")],
    ]);

    const result = computeCashBankCredits(
      [
        { accountId: 1, type: "credit", amount: "100.00" },
        { accountId: 2, type: "credit", amount: "250.50" },
      ],
      accountsById,
    );

    expect(result.get(1)).toBe(10000n);
    expect(result.get(2)).toBe(25050n);
  });
});
