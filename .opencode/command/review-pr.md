---
description: Run an automated review/fix loop for the current MVP slice diff.
agent: build
---

Review the current worktree diff for the active MVP slice.

Workflow:

1. Inspect `git diff` and the related roadmap slice in `docs/mvp-roadmap.md`.
2. Ask `code-reviewer` to review the diff for bugs, accounting regressions, missing validations, missing tests, and scope creep.
3. Summarize the findings.
4. Fix findings that are clearly correct and in scope.
5. Do not fix speculative or out-of-scope suggestions without asking.
6. Rerun focused validation.
7. Report final status, changed files, validation results, and remaining risks.

This command is the manual trigger for an automated review workflow; do not stop after only listing findings if fixes are straightforward.
