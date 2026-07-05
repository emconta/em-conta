---
description: Validate the app against the required accounting MVP demo flow.
agent: build
---

Validate the current app against `docs/mvp-roadmap.md`, `AGENTS.md`, and the final demo acceptance checklist.

Check:

1. Login/dashboard flow exists.
2. Sale of R$ 10,000 can be represented correctly.
3. Purchase/CMV of R$ 4,000 is handled according to the chosen demo accounting treatment.
4. Expense of R$ 1,000 is represented correctly.
5. Unbalanced debit/credit entry is rejected.
6. Balance Sheet shows Assets = Liabilities + Equity.
7. DRE result matches the expected demo treatment.
8. Current liquidity handles normal and zero-liability cases.
9. Cash account ledger shows movements and running balance.
10. Dashboard cash/bank balance comes from journal lines, not guessed totals.

Use `accounting-advisor` for any accounting uncertainty.

Run the narrowest useful commands available in this repo. Report pass/fail by requirement with file, endpoint, or screen references where possible. Do not implement broad missing features unless the user asks; this command is primarily for validation and gap reporting.
