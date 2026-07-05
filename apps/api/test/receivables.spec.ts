import { describe, expect, it } from "vitest";

describe("receivables outstanding calculation", () => {
  function computeOutstanding(netAmount: string, receivedAmount: string) {
    const net = Number(netAmount);
    const received = Number(receivedAmount);

    return (net - received).toFixed(2);
  }

  it("computes outstanding with no receipts", () => {
    expect(computeOutstanding("10000.00", "0.00")).toBe("10000.00");
  });

  it("computes outstanding with partial receipt", () => {
    expect(computeOutstanding("10000.00", "5000.00")).toBe("5000.00");
  });

  it("computes outstanding with full receipt", () => {
    expect(computeOutstanding("10000.00", "10000.00")).toBe("0.00");
  });

  it("handles decimal amounts correctly", () => {
    expect(computeOutstanding("1000.50", "333.33")).toBe("667.17");
  });

  it("handles zero net amount", () => {
    expect(computeOutstanding("0.00", "0.00")).toBe("0.00");
  });
});
