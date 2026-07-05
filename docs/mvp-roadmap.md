# emConta MVP Roadmap

Use this as the durable PR plan for building the remaining classroom/demo MVP. Keep slices small enough to review, validate, and merge independently.

## Workflow

- Work one unchecked slice at a time, top to bottom unless repo evidence makes a later slice safer first.
- Before coding accounting behavior, consult `accounting-advisor` for journal entries, report formulas, and acceptance cases.
- Backend first when a slice needs new data/API behavior; frontend after the API shape is stable.
- Each slice should end with focused validation, then `code-reviewer` review of the diff.
- Mark a slice complete only after code, tests or focused checks, and review fixes are done.
- Frontend list/detail screens should use the table-first UX: `@tanstack/react-table` with search, filters, top action buttons, create/edit modals, and row-click detail modals. Avoid returning to large inline create forms plus clumsy card lists.
- Sales screens must keep a visible shortcut to create products/services before selling.

## UI Pattern Baseline

- Use reusable table and modal components for operational modules such as vendas, produtos/estoque, lançamentos, ledger, reports, receivables, and payables.
- Page body should prioritize the table; creation forms belong in modals opened from a top action button.
- Clicking a table row should open a detail modal when detail data exists.
- Tables should provide at least text search and the most useful MVP filters for the module.

## PR Slices

### 1. Manual Journal Entries

Status: completed

Goal: let the user create a simple debit/credit journal entry manually and reject unbalanced entries.

Definition of done:

- Authenticated API can create a manual journal entry for the current user's company.
- Request supports date, memo/history, and two or more lines.
- API rejects empty lines, non-positive amounts, unbalanced debit/credit totals, and accounts outside the company.
- Frontend has a basic "Novo Lancamento" flow or clearly reachable screen.
- Focused tests cover balanced success and unbalanced rejection.

### 2. Simple Inventory Management

Status: completed

Goal: let the user manage stock for products with `trackInventory` before selling them.

Definition of done:

- API can record stock intake for a tracked product with quantity, unit cost, date, and payment account.
- Stock intake creates a `purchase` stock movement.
- If paid in cash/bank, stock intake posts: Debit `inventory`, Credit `cash` or `bank_checking`.
- API rejects stock intake for services or products without `trackInventory`.
- API rejects non-positive quantity, non-positive unit cost, invalid dates, and accounts outside the company.
- Product list or detail API exposes current quantity, total cost, and average unit cost for tracked products.
- Frontend lets the user add stock for tracked products and see current stock.
- Sales of tracked products continue to block negative stock and snapshot average cost at sale time.
- Focused tests cover stock intake, current stock calculation, and negative stock rejection.

### 3. Account Ledger / Razao

Status: pending

Goal: show movements and running balance for one account.

Definition of done:

- API returns account ledger rows with date, memo/history, source, debit, credit, and running balance.
- Running balance respects account nature: debit accounts increase with debits; credit accounts increase with credits.
- Frontend lets the user choose an account and view its ledger.
- Demo check: Cash ledger shows the sale, purchase/payment, and expense movements.

### 4. DRE

Status: pending

Goal: calculate and display Demonstração de Resultado for a period.

Definition of done:

- API sums revenue and expense accounts from posted journal lines in the selected period.
- DRE returns total revenue, total expenses, and net result.
- Frontend DRE screen supports a simple period filter or sensible default period.
- Demo check explicitly handles whether R$ 4,000 is inventory only or CMV; expected class demo profit is R$ 5,000 only when CMV is posted.

### 5. Balance Sheet

Status: pending

Goal: calculate and display Balance Sheet with Assets = Liabilities + Equity.

Definition of done:

- API groups accounts into assets, liabilities, and equity.
- If there is no closing process, current-period result is included in equity as `Resultado do periodo`.
- Frontend Balance Sheet screen shows totals and the equality check.
- Demo check: balance remains true after the sample entries.

### 6. Current Liquidity

Status: pending

Goal: calculate current liquidity ratio.

Definition of done:

- API calculates current assets / current liabilities using appropriate account classifications.
- Zero current liabilities returns `N/A` or an explanatory state, not an invalid number.
- Frontend displays the result on dashboard or report screen.
- Focused checks cover normal and zero-liability cases.

### 7. Dashboard MVP

Status: pending

Goal: make the dashboard useful for the final demo.

Definition of done:

- Dashboard shows consolidated Cash + Bank balance from posted journal lines.
- Dashboard shows latest profit/loss using DRE logic.
- Dashboard shows or links to current liquidity.
- Dashboard links to required demo flows: new entry/sale, reports, ledger.

### 8. Receivables And Payables MVP

Status: pending

Goal: cover the required Contas a Receber and Contas a Pagar scope without overbuilding.

Definition of done:

- Receivables from credit sales can be listed and settled through receipts.
- Payables can be represented at least through manual, expense, or inventory purchase-related postings.
- Over-receipt is rejected if settlement UI/API exists.
- Source links remain available for automatic postings.

### 9. Demo Seed / Smoke Path

Status: pending

Goal: make the final classroom demo repeatable.

Definition of done:

- There is a documented or implemented way to create the sample demo state.
- Sample sale: R$ 10,000 cash sale.
- Sample tracked product has enough stock before sale.
- Sample inventory/CMV treatment: R$ 4,000 handled consistently with the chosen DRE expectation.
- Sample expense: R$ 1,000 cash expense.
- Acceptance checklist passes: unbalanced entry rejection, BP equality, DRE result, liquidity, Cash ledger.

## Final Demo Acceptance Checklist

- Login loads dashboard.
- Create or use a tracked product with enough stock for the demo sale.
- Register stock intake or purchase of R$ 4,000: Debit Inventory, Credit Cash/Bank or another valid source account.
- Register sale of R$ 10,000: Debit Cash/Bank, Credit Revenue; if the sold product tracks stock, also Debit CMV and Credit Inventory.
- Register expense of R$ 1,000: Debit Expense, Credit Cash/Bank.
- Unbalanced journal entry is rejected with a clear error.
- Balance Sheet shows Assets = Liabilities + Equity.
- DRE shows the expected profit for the chosen treatment.
- Current liquidity shows a correct value or `N/A` when current liabilities are zero.
- Cash ledger shows date, history, debits, credits, and running balance.
- Product stock view shows quantity and average cost after intake and sale.
- Dashboard cash/bank and profit/loss values come from journal lines, not guessed totals.
