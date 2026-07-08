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

Status: completed

Goal: show movements and running balance for one account.

Definition of done:

- API returns account ledger rows with date, memo/history, source, debit, credit, and running balance.
- Running balance respects account nature: debit accounts increase with debits; credit accounts increase with credits.
- Frontend lets the user choose an account and view its ledger.
- Demo check: Cash ledger shows the sale, purchase/payment, and expense movements.

### 4. DRE

Status: completed

Goal: calculate and display Demonstração de Resultado for a period.

Definition of done:

- API sums revenue and expense accounts from posted journal lines in the selected period.
- DRE returns total revenue, total expenses, and net result.
- Frontend DRE screen supports a simple period filter or sensible default period.
- Demo check explicitly handles whether R$ 4,000 is inventory only or CMV; expected class demo profit is R$ 5,000 only when CMV is posted.

### 5. Balance Sheet

Status: completed

Goal: calculate and display Balance Sheet with Assets = Liabilities + Equity.

Definition of done:

- API groups accounts into assets, liabilities, and equity.
- If there is no closing process, current-period result is included in equity as `Resultado do periodo`.
- Frontend Balance Sheet screen shows totals and the equality check.
- Demo check: balance remains true after the sample entries.

### 6. Current Liquidity

Status: completed

Goal: calculate current liquidity ratio.

Definition of done:

- API calculates current assets / current liabilities using appropriate account classifications.
- Zero current liabilities returns `N/A` or an explanatory state, not an invalid number.
- Frontend displays the result on dashboard or report screen.
- Focused checks cover normal and zero-liability cases.

### 7. Dashboard MVP

Status: completed

Goal: make the dashboard useful for the final demo.

Definition of done:

- Dashboard shows consolidated Cash + Bank balance from posted journal lines.
- Dashboard shows latest profit/loss using DRE logic.
- Dashboard shows or links to current liquidity.
- Dashboard links to required demo flows: new entry/sale, reports, ledger.

### 8. Receivables And Payables MVP

Status: completed

Goal: cover the required Contas a Receber and Contas a Pagar scope without overbuilding.

Definition of done:

- Receivables from credit sales can be listed and settled through receipts.
- Payables can be represented at least through manual, expense, or inventory purchase-related postings.
- Over-receipt is rejected if settlement UI/API exists.
- Source links remain available for automatic postings.

### 9. Chart of Accounts / Plano de Contas

Status: completed

Goal: display the company's chart of accounts as a hierarchical, numbered plan and keep the ledger accessible per account.

Definition of done:

- Frontend page shows accounts grouped by category (Ativo, Passivo, Patrimônio Líquido, Receitas, Despesas).
- Account codes are auto-generated from the hierarchy (e.g., `1 Ativo`, `1.1 Clientes a receber`, `1.2 Estoque`, `2 Passivo`, `2.1 Fornecedores a pagar`).
- Hierarchy is collapsible and rows are visually indented by depth.
- Clicking an account opens a detail modal with its ledger movements and running balance.
- The old "Razão" route is replaced by the new "Plano de Contas" route in the sidebar and page titles.
- Existing ledger API remains available for the detail modal.

### 10. Prevent Negative Cash/Bank Balances

Status: completed

Goal: prevent cash or bank accounts from going negative through sales and journal entries.

Definition of done:

- API rejects manual journal entries that credit cash/bank accounts beyond the available posted balance.
- API rejects cash/bank sales and stock purchases when the payment account would become negative.
- Validation uses account balances from posted journal lines and stable account keys, not display names.
- Error messages clearly explain which account has insufficient balance.
- Focused tests cover accepted transactions with enough balance and rejected transactions with insufficient balance.

### 11. Fix Masked Input Editing

Status: completed

Goal: make masked currency/number inputs editable without forcing the user to select the entire current value first.

Definition of done:

- Currency and numeric masked inputs allow normal cursor positioning, deletion, replacement, and partial edits.
- Existing form validation and submitted numeric values remain unchanged.
- Fix is applied consistently to sales, journal entries, stock intake, receipts, payables, and report filters where masks exist.
- Manual checks cover desktop and mobile typing behavior.

### 12. Manual Journal Entry Form Revamp

Status: pending

Goal: redesign the manual journal entry form so users can clearly see and edit each line's debit and credit side, similar to Odoo's journal entry table.

Definition of done:

- Manual journal entry creation uses a table-first form inside the existing create/edit modal flow, replacing any layout that hides debit/credit direction behind generic fields.
- Header fields stay above the lines table and include at least date and memo/history, with sensible defaults and validation shown before submit.
- Lines table columns are ordered as account, label/description, debit, credit, and row actions; debit and credit are separate editable currency inputs.
- Each row can have either debit or credit filled, never both; when the user enters a positive value on one side, the opposite side is automatically cleared or kept as zero.
- Empty debit and credit cells are visually rendered as `R$ 0,00` or an equivalent muted empty state so the side of the posting remains obvious.
- The account column uses the existing account combobox/search behavior, showing account code and name, and allowing keyboard search before selecting an account.
- The label/description column is an optional per-line note that defaults from the header memo or selected account when useful, but remains independently editable.
- The form always keeps one blank visible line at the bottom for quick insertion; focusing or selecting an account in that blank line turns it into a real line and immediately appends a new blank line.
- Users can add lines with keyboard-first flow: select account, tab to label, tab to debit, tab to credit, then continue to the next blank line.
- Users can remove non-empty lines with a visible row action; removing a line immediately recalculates totals and validation state.
- Footer shows total debit and total credit aligned under their columns and updates as the user edits values.
- If totals differ, the footer clearly shows the imbalance amount and submit is blocked with a plain-language validation message.
- If totals match and all non-empty rows are valid, the footer shows a balanced state and submit is enabled.
- A line is considered valid only when it has an account and exactly one positive amount on debit or credit.
- Blank trailing rows are ignored on submit and do not trigger validation errors.
- Existing API payload remains balanced debit/credit lines compatible with the current backend contract unless a backend change is explicitly required.
- Existing backend validations for empty lines, non-positive amounts, unbalanced totals, company account ownership, and insufficient cash/bank balance remain authoritative.
- Currency inputs use the fixed masked-input behavior, allowing normal cursor positioning, partial edits, deletion, paste, and mobile numeric keyboard input.
- The modal remains usable on smaller screens: table can scroll horizontally if necessary, totals and primary actions remain visible, and no column becomes ambiguous.
- Accessibility is covered with explicit labels or accessible column headers for account, label, debit, credit, remove row, totals, and validation messages.
- Manual checks cover creating a simple two-line entry, adding three or more lines, editing an existing amount side, switching a value from debit to credit, deleting a line, submitting balanced entries, and seeing blocked unbalanced entries.

### 13. Root Redirect To Dashboard

Status: pending

Goal: redirect visits to `/` to `/dashboard` so authenticated users land on the main app screen.

Definition of done:

- Navigating to `/` redirects to `/dashboard`.
- Redirect works on direct browser load and client-side navigation.
- Auth behavior remains intact for unauthenticated users.
- Smoke check confirms `/dashboard` still loads normally.

### 14. Dashboard Current Month Net Profit Card

Status: pending

Goal: replace the dashboard current liquidity card with current-month net profit.

Definition of done:

- Dashboard third summary card shows net profit/loss for the current month using DRE logic.
- Card label and helper text make the period explicit.
- Existing liquidity report remains reachable outside the dashboard card.
- Values come from journal lines, not guessed totals.
- Focused check compares the card value with the DRE result for the same current-month period.

### 15. Accounting Help Hover Cards

Status: pending

Goal: add contextual help so users without accounting experience can understand key system terms.

Definition of done:

- Key accounting terms and actions have information buttons using the shadcn hover card component.
- Help text is concise, plain-language Portuguese and avoids overwhelming experienced users.
- Initial coverage includes dashboard cards, DRE, Balance Sheet, ledger/account plan, sales posting, receivables, payables, and journal entries.
- Hover cards are keyboard accessible and usable on mobile or have an acceptable mobile interaction.
- Visual treatment fits the existing design system.

### 16. Detailed DRE Report

Status: pending

Goal: make DRE more useful by showing the values that compose each calculated total.

Definition of done:

- DRE report groups rows into meaningful sections such as receita bruta, deduções, receita líquida, custos, despesas, and resultado.
- Each section shows account-level or category-level detail lines that reconcile to the section total.
- Report includes amount and percentage-of-revenue columns where meaningful.
- Existing total revenue, total expenses, and net result remain available and consistent with the detailed view.
- Empty groups render clearly without misleading zero rows.
- Focused tests or checks cover section totals and final net result reconciliation.

### 17. Detailed Balance Sheet Report

Status: pending

Goal: make Balance Sheet more useful by listing the account values that compose asset, liability, and equity totals.

Definition of done:

- Balance Sheet report lists accounts under their respective groups for assets, liabilities, and equity.
- Current/non-current or similar subgrouping is shown when account classification data supports it.
- Group totals reconcile to the final Assets and Liabilities + Equity totals.
- Equality check remains visible and uses the same totals shown in the detailed rows.
- Zero-balance accounts are hidden or clearly handled according to the chosen UX.
- Focused tests or checks cover account detail totals and the balance equality.

### 18. CSV Report Export

Status: pending

Goal: let users export system-generated reports as `.csv` files.

Definition of done:

- DRE, Balance Sheet, account ledger, and other implemented reports expose CSV export actions.
- CSV exports respect the same filters and periods currently shown on screen.
- CSV files include clear headers, formatted dates, and raw numeric values suitable for spreadsheets.
- Download filenames identify report type and period/date.
- Export works without exposing data from other companies.
- Focused checks cover at least DRE, Balance Sheet, and ledger exports.

### 19. Demo Seed / Smoke Path

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
