import {
  buildLedgerDto,
  moneyFromCents,
  moneyToCents,
  updateRunningBalance,
} from "@api/features/ledger/ledger.service";
import { describe, expect, it } from "vitest";

const baseDate = new Date("2026-01-15T12:00:00.000Z");

function makeLine(
  line: { amount: string; description?: string; id: number; type: "debit" | "credit" },
  entry: { entryDate?: Date; id?: number; memo?: string; sourceType?: string } = {},
) {
  return {
    line: {
      id: line.id,
      entryId: entry.id ?? 1,
      accountId: 10,
      type: line.type,
      amount: line.amount,
      description: line.description ?? null,
    },
    entry: {
      id: entry.id ?? 1,
      companyId: 1,
      sourceType: (entry.sourceType ?? "manual") as
        | "sale"
        | "receipt"
        | "stock_issue"
        | "purchase"
        | "manual"
        | "reversal",
      sourceId: null,
      entryDate: entry.entryDate ?? baseDate,
      memo: entry.memo ?? null,
      status: "posted" as const,
      createdAt: baseDate,
      updatedAt: baseDate,
    },
  };
}

describe("ledger running balance", () => {
  it("increases debit-nature accounts with debits", () => {
    expect(updateRunningBalance(0n, "debit", 100000n, 0n)).toBe(100000n);
  });

  it("decreases debit-nature accounts with credits", () => {
    expect(updateRunningBalance(100000n, "debit", 0n, 1000n)).toBe(99000n);
  });

  it("increases credit-nature accounts with credits", () => {
    expect(updateRunningBalance(0n, "credit", 0n, 100000n)).toBe(100000n);
  });

  it("decreases credit-nature accounts with debits", () => {
    expect(updateRunningBalance(0n, "credit", 2000n, 0n)).toBe(-2000n);
  });
});

describe("ledger DTO builder", () => {
  it("starts with an opening balance row", () => {
    const ledger = buildLedgerDto({ id: 10, name: "Caixa", type: "cash", nature: "debit" }, []);

    expect(ledger.accountId).toBe(10);
    expect(ledger.accountNature).toBe("debit");
    expect(ledger.rows).toHaveLength(1);
    expect(ledger.rows[0]).toMatchObject({
      entryId: null,
      memo: "Saldo inicial",
      debit: "0.00",
      credit: "0.00",
      balance: "0.00",
    });
  });

  it("shows cash ledger after a cash sale", () => {
    const ledger = buildLedgerDto({ id: 10, name: "Caixa", type: "cash", nature: "debit" }, [
      makeLine(
        { id: 1, amount: "10000.00", type: "debit" },
        { memo: "Venda #1", sourceType: "sale" },
      ),
    ]);

    expect(ledger.rows).toHaveLength(2);
    expect(ledger.rows[1]).toMatchObject({
      memo: "Venda #1",
      debit: "10000.00",
      credit: "0.00",
      balance: "10000.00",
    });
  });

  it("shows cash ledger after a sale and an expense", () => {
    const ledger = buildLedgerDto({ id: 10, name: "Caixa", type: "cash", nature: "debit" }, [
      makeLine(
        { id: 1, amount: "10000.00", type: "debit" },
        { id: 1, memo: "Venda #1", sourceType: "sale" },
      ),
      makeLine(
        { id: 2, amount: "1000.00", type: "credit" },
        { id: 2, memo: "Despesa #1", sourceType: "manual" },
      ),
    ]);

    expect(ledger.rows[1]?.balance).toBe("10000.00");
    expect(ledger.rows[2]?.balance).toBe("9000.00");
  });

  it("shows revenue ledger with credit-nature balance", () => {
    const ledger = buildLedgerDto(
      { id: 20, name: "Receita de vendas", type: "sales_revenue", nature: "credit" },
      [
        makeLine(
          { id: 1, amount: "10000.00", type: "credit" },
          { memo: "Venda #1", sourceType: "sale" },
        ),
      ],
    );

    expect(ledger.rows[1]?.balance).toBe("10000.00");
  });

  it("sorts rows by entry date then entry id", () => {
    const ledger = buildLedgerDto({ id: 10, name: "Caixa", type: "cash", nature: "debit" }, [
      makeLine(
        { id: 1, amount: "5000.00", type: "debit" },
        { id: 2, entryDate: new Date("2026-01-20T12:00:00.000Z"), memo: "Later" },
      ),
      makeLine(
        { id: 2, amount: "3000.00", type: "debit" },
        { id: 1, entryDate: new Date("2026-01-10T12:00:00.000Z"), memo: "Earlier" },
      ),
    ]);

    expect(ledger.rows[1]?.memo).toBe("Earlier");
    expect(ledger.rows[1]?.balance).toBe("3000.00");
    expect(ledger.rows[2]?.memo).toBe("Later");
    expect(ledger.rows[2]?.balance).toBe("8000.00");
  });

  it("combines entry memo and line description", () => {
    const ledger = buildLedgerDto({ id: 10, name: "Caixa", type: "cash", nature: "debit" }, [
      makeLine(
        { id: 1, amount: "100.00", type: "debit", description: "Detalhe" },
        { memo: "Lançamento" },
      ),
    ]);

    expect(ledger.rows[1]?.memo).toBe("Lançamento — Detalhe");
  });

  it("returns null memo when memo and description are empty", () => {
    const ledger = buildLedgerDto({ id: 10, name: "Caixa", type: "cash", nature: "debit" }, [
      makeLine({ id: 1, amount: "100.00", type: "debit" }, { sourceType: "sale" }),
    ]);

    expect(ledger.rows[1]?.memo).toBeNull();
  });
});

describe("ledger money helpers", () => {
  it("converts valid money strings to cents", () => {
    expect(moneyToCents("0.00")).toBe(0n);
    expect(moneyToCents("1.00")).toBe(100n);
    expect(moneyToCents("1.50")).toBe(150n);
    expect(moneyToCents("123.45")).toBe(12345n);
  });

  it("rejects negative, empty, and malformed money strings", () => {
    expect(() => moneyToCents("-1.00")).toThrow();
    expect(() => moneyToCents("")).toThrow();
    expect(() => moneyToCents("1.001")).toThrow();
    expect(() => moneyToCents("1,00")).toThrow();
  });

  it("converts cents back to money strings", () => {
    expect(moneyFromCents(0n)).toBe("0.00");
    expect(moneyFromCents(100n)).toBe("1.00");
    expect(moneyFromCents(-150n)).toBe("-1.50");
  });
});
