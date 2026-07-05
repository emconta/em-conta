---
description: Implement the next PR-sized MVP slice from the roadmap.
agent: build
---

Read `AGENTS.md` and `docs/mvp-roadmap.md`.

Pick the next unimplemented PR-sized MVP slice. Before coding, inspect the current repo state and confirm what already exists.

Workflow:

1. Identify the next slice and state it briefly.
2. Consult `accounting-advisor` if the slice affects journal entries, reports, balances, account classifications, receivables, payables, inventory, DRE, Balance Sheet, liquidity, dashboard numbers, or ledger behavior.
3. Implement the smallest correct vertical slice.
4. Add or update focused tests where practical.
5. Run the narrowest useful validation command from `AGENTS.md`.
6. Ask `code-reviewer` to review the current diff.
7. Fix high-confidence review findings that are in scope.
8. Update `docs/mvp-roadmap.md` status for the slice only if code, validation, and review fixes are done.
9. Report changed files, validation results, and remaining risks.

Keep the work PR-sized. Do not jump into broad refactors or unrelated roadmap items.
