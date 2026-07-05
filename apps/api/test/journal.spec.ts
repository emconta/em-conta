import { getJournalLineTotals, parseJournalDate } from "@api/features/journal/journal.service";
import { describe, expect, it } from "vitest";

describe("journal line totals", () => {
  it("sums balanced debit and credit lines", () => {
    const totals = getJournalLineTotals([
      { amount: "1000.00", type: "debit" },
      { amount: "1000.00", type: "credit" },
    ]);

    expect(totals).toEqual({ credit: 100000n, debit: 100000n });
  });

  it("exposes different totals for unbalanced entries", () => {
    const totals = getJournalLineTotals([
      { amount: "1000.00", type: "debit" },
      { amount: "900.00", type: "credit" },
    ]);

    expect(totals).toEqual({ credit: 90000n, debit: 100000n });
  });

  it("rejects zero, negative, and malformed amounts", () => {
    expect(getJournalLineTotals([{ amount: "0.00", type: "debit" }])).toBe("INVALID_AMOUNT");
    expect(getJournalLineTotals([{ amount: "-1.00", type: "debit" }])).toBe("INVALID_AMOUNT");
    expect(getJournalLineTotals([{ amount: "1.001", type: "debit" }])).toBe("INVALID_AMOUNT");
  });
});

describe("journal date parsing", () => {
  it("rejects impossible calendar dates", () => {
    expect(parseJournalDate("2026-02-31T12:00:00.000Z")).toBeNull();
  });

  it("accepts valid ISO dates", () => {
    expect(parseJournalDate("2026-02-28T12:00:00.000Z")?.toISOString()).toBe(
      "2026-02-28T12:00:00.000Z",
    );
  });
});
