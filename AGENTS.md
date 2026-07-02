# em-conta Guide

## Project Context

`em-conta` is a bookkeeping system for Brazilian micro businesses and solo entrepreneurs.

The current implemented baseline is:

- onboarding creates a `company`
- onboarding copies a seeded simple chart of accounts into `accounts`
- backend uses Hono + Effect + Drizzle + PostgreSQL
- frontend uses React + TanStack Router + TanStack Query

The next major domain milestone is sales posting with correct double-entry accounting, inventory impact for products, and a journal view for auditability.

## Current Architecture

### Backend

- `apps/api/src/app.ts` wires Hono routes under `/api/v1`
- feature folders live in `apps/api/src/features/*`
- repositories are small Effect services over `Database.execute`
- services coordinate domain logic and repo calls
- DTOs live in `packages/dto/src/*`
- request validation uses Valibot through `hono-openapi`
- schema lives in `apps/api/src/db/schema/*`
- migrations live in `apps/api/src/db/migrations/*`

### Frontend

- routes live in `apps/web/src/routes/*`
- feature UI and queries live in `apps/web/src/features/*`
- API client lives in `apps/web/src/lib/api.ts`
- API calls are wrapped by `apps/web/src/lib/callApi.ts`

## Coding Standards Observed In This Repo

These conventions are already present and should be preserved.

### General

- TypeScript-first codebase
- path aliases such as `@api`, `@web`, and `@dto`
- prefer small feature-oriented files over large shared abstractions
- use ASCII text by default
- keep naming explicit and domain-oriented

### Backend Style

- use Effect services for repositories and domain services
- keep repositories thin and focused on persistence
- keep orchestration in services, not controllers
- use `Effect.gen(function* () {})` consistently
- use tagged domain errors with `Data.TaggedError`
- return typed failures for expected business cases
- keep Hono controllers slim: validate input, call service, map response
- use Drizzle schema types as the source of truth for persistence types

### Validation and DTOs

- define request contracts in `packages/dto`
- use Valibot schemas and exported inferred input types
- keep validation near API boundaries

### Frontend Style

- colocate feature queries with feature pages
- use TanStack Query for server state
- use the shared `callApi` wrapper instead of manual fetch handling
- keep route files thin and page components in feature folders

### Domain Modeling

- avoid encoding business logic by account display name alone
- prefer stable system keys for accounts and other core entities
- preserve traceability between business events and accounting entries
- automatic accounting postings must be reproducible and auditable

## Cloudflare Workers Notes

Cloudflare Workers APIs and limits change often. Before any task involving Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, AI, or Agents SDK, retrieve current documentation.

### Docs

- https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`

For limits and quotas, retrieve the product `/platform/limits/` page.

### Commands

| Command | Purpose |
|---------|---------|
| `npx wrangler dev` | Local development |
| `npx wrangler deploy` | Deploy to Cloudflare |
| `npx wrangler types` | Generate TypeScript types |

Run `wrangler types` after changing bindings in Wrangler configuration.

### Compatibility and Errors

- Node compatibility: https://developers.cloudflare.com/workers/runtime-apis/nodejs/
- Error reference: https://developers.cloudflare.com/workers/observability/errors/
- Error 1102 requires checking current Workers limits docs

## Accounting Roadmap

This is the recommended implementation plan for sales, inventory, receivables, and journal visibility.

### Goal

Support both services and products with:

- correct double-entry postings
- cash and credit sales
- inventory reduction for product sales
- cost of goods sold recognition
- later receipt of credit sales
- a journal screen for audit and trust

## Core Accounting Rules

### 1. Service Sale Paid Immediately

- debit: cash or bank
- credit: service revenue

### 2. Service Sale On Credit

- debit: accounts receivable
- credit: service revenue

### 3. Product Sale Paid Immediately

Posting A:

- debit: cash or bank
- credit: sales revenue

Posting B:

- debit: cost of goods sold
- credit: inventory

### 4. Product Sale On Credit

Posting A:

- debit: accounts receivable
- credit: sales revenue

Posting B:

- debit: cost of goods sold
- credit: inventory

### 5. Receipt Of A Credit Sale

- debit: cash or bank
- credit: accounts receivable

### Mandatory Rules

- total debits must equal total credits for every journal entry
- revenue recognition and cash receipt are separate events for credit sales
- automatic postings must always link back to their originating business event
- inventory and cost posting only occur for product items that track stock

## Required Domain Changes

### 1. Strengthen Accounts

Current `accounts` rows are not sufficient for safe automation because they only identify accounts by display fields.

Add a stable system key to both chart templates and instantiated company accounts.

Suggested field:

- `key: varchar | null`

Suggested system keys:

- `cash`
- `bank_checking`
- `accounts_receivable`
- `inventory`
- `sales_revenue`
- `services_revenue`
- `cogs`
- `taxes_payable`

Rules:

- system keys must be unique per company when present
- seeded charts should carry these keys
- onboarding must copy these keys into company accounts
- business automation must resolve accounts by key, not by display name

### 2. Add Products

Create `products` for both products and services.

Suggested fields:

- `id`
- `companyId`
- `name`
- `type` with values `product | service`
- `defaultSalePrice`
- `trackInventory`
- `costMethod`
- `isActive`
- timestamps

Rules:

- services do not track inventory
- products may require inventory tracking
- MVP should use `average_cost`

### 3. Add Inventory Movements

Create `stock_movements`.

Suggested fields:

- `id`
- `companyId`
- `productId`
- `type` with values like `purchase`, `sale_issue`, `adjustment`
- `quantity`
- `unitCost`
- `totalCost`
- `date`
- `sourceType`
- `sourceId`
- timestamps

Rules:

- every product sale that tracks inventory must create a stock movement
- stock movement must preserve the cost used for accounting
- do not recompute old accounting entries when costs change later

### 4. Add Sales

Create `sales` and `sale_items`.

Suggested `sales` fields:

- `id`
- `companyId`
- `kind` with values `product | service | mixed`
- `paymentTerms` with values `cash | credit`
- `issueDate`
- `description`
- `customerName` nullable for MVP
- `grossAmount`
- `discountAmount`
- `netAmount`
- `status`
- timestamps

Suggested `sale_items` fields:

- `id`
- `saleId`
- `productId` nullable when custom line is allowed later
- `description`
- `type` with values `product | service`
- `quantity`
- `unitPrice`
- `lineAmount`
- `unitCostSnapshot` nullable for services
- `lineCostAmount` nullable for services

Rules:

- the sale header is the business document
- accounting entries are generated from it
- item cost must be snapshotted at posting time for product items

### 5. Add Journal Entries

Create `journal_entries` and `journal_entry_lines`.

Suggested `journal_entries` fields:

- `id`
- `companyId`
- `sourceType` with values `sale | receipt | stock_issue | manual | reversal`
- `sourceId`
- `entryDate`
- `memo`
- `status`
- timestamps

Suggested `journal_entry_lines` fields:

- `id`
- `entryId`
- `accountId`
- `type` with values `debit | credit`
- `amount`
- `description`

Rules:

- all lines must belong to accounts from the same company
- every entry must balance
- automatic entries should not be silently edited after posting
- if correction is needed, prefer reversal plus replacement

### 6. Add Receipts For Credit Sales

Two acceptable approaches:

- `receipts` table for explicit receipt events
- or reuse a more generic `financial_receipts` model

For current scope, `receipts` is simpler.

Suggested fields:

- `id`
- `companyId`
- `saleId`
- `receiptDate`
- `amount`
- `cashAccountId`
- `notes`
- timestamps

Rules:

- every receipt must create its own journal entry
- receipt account must be a liquidity account such as cash or bank

## Recommended Implementation Phases

### Phase 1. Foundations

1. Add `key` to chart account definitions and to `accounts` schema.
2. Regenerate and run migrations.
3. Update onboarding account creation to copy the new key.
4. Add repository helpers to fetch accounts by company and key.

Deliverable:

- company accounts can be resolved safely for automatic postings

### Phase 2. Journal Infrastructure

1. Add `journal_entries` and `journal_entry_lines` schema.
2. Add repos for entry creation and querying.
3. Add `JournalService` with rules:
- validate account ownership
- validate balance
- create header and lines in one database transaction
4. Add DTOs for journal queries, not public creation yet.

Deliverable:

- reusable accounting posting engine exists before sales automation

### Phase 3. Products And Inventory

1. Add `products` schema.
2. Add `stock_movements` schema.
3. Add product and stock repos.
4. Add `InventoryService`:
- current stock
- average cost calculation
- stock issue posting data for sale items
5. Decide whether to block negative stock in MVP.

Recommended MVP rule:

- block sales that would create negative stock

Deliverable:

- products can carry cost and stock data required for CMV

### Phase 4. Sales Domain

1. Add `sales` and `sale_items` schema.
2. Add `SalesRepo`.
3. Add `SalesService.create` with flow:
- validate company
- validate selected liquidity account for cash sales
- validate items
- load required system accounts
- snapshot costs for product items
- create sale and items
- create revenue journal entry
- create stock issue journal entry when needed
- create stock movements
4. Return sale id and created journal entry ids.

Deliverable:

- sales become the main business command with automatic accounting consequences

### Phase 5. Receipts

1. Add `receipts` schema.
2. Add `ReceiptsService.create` with flow:
- validate outstanding receivable from sale
- validate cash or bank account
- create receipt event
- post debit cash/bank and credit accounts receivable
3. Prevent over-receipt.

Deliverable:

- credit sales can be settled properly without mutating original revenue entry

### Phase 6. Journal Read APIs

1. Add `GET /journal` with filters:
- date range
- source type
- account id
- search text
2. Add `GET /journal/:id` with header, lines, and source reference.
3. Add response DTOs tailored for journal UI.

Deliverable:

- users can inspect how each operation hit the ledger

### Phase 7. Frontend Screens

1. Products screen
- create product or service
- manage stock-related fields
2. Sales screen
- create sale
- choose items
- choose payment terms
- choose receiving account for cash sales
3. Receipts screen
- settle open receivables
4. Journal screen
- list entries
- filter entries
- open detail drawer or page

Deliverable:

- complete user workflow from operation entry to accounting verification

## Service Design Recommendations

### `AccountsRepo`

Add queries such as:

- `getByCompanyAndKey`
- `listByCompany`

### `JournalService`

Responsibilities:

- accept normalized posting lines
- validate debit/credit totals
- validate all accounts belong to the company
- persist entry and lines atomically

This should be the only write path for journal entries.

### `InventoryService`

Responsibilities:

- calculate or resolve average cost
- validate stock availability
- create stock issue data for sale items

### `SalesService`

Responsibilities:

- create sale document
- decide which accounts are used
- call `JournalService`
- call `InventoryService`
- keep product, service, and mixed sales consistent

### `ReceiptsService`

Responsibilities:

- settle open receivables
- create receipt business event
- call `JournalService`

## API Proposal

Suggested endpoints:

- `POST /api/v1/products`
- `GET /api/v1/products`
- `POST /api/v1/sales`
- `GET /api/v1/sales`
- `GET /api/v1/sales/:id`
- `POST /api/v1/receipts`
- `GET /api/v1/journal`
- `GET /api/v1/journal/:id`

Suggested DTO concerns:

- cash sales must include `cashAccountId`
- credit sales must not require `cashAccountId`
- sale items should carry `productId`, `quantity`, and optional override description
- journal list should return compact summaries with totals and source labels

## Journal UX Requirements

The journal screen is necessary and should not be treated as optional admin functionality.

Show at least:

- entry date
- memo or history
- source type and source id
- lines with account name, debit, and credit
- total debits and credits
- filter by date, source type, and account

Recommended detail behavior:

- clicking a journal entry opens its full lines
- if entry source is a sale or receipt, provide a direct link to the source record

## Important Accounting Constraints

### Do Now

- support products and services
- support mixed sales
- support inventory and cost of goods sold
- support later receipt of receivables
- support journal inspection

### Defer For Later

- automatic tax postings
- fiscal document integration
- multiple warehouses
- lot or expiry tracking
- FIFO or more advanced costing
- partial reversal workflows beyond simple reversal entries

## Recommended MVP Decisions

Unless the product requirements change, use these defaults.

- allow mixed sales with both products and services in the same sale
- keep `customerName` as free text first, add customers table later
- use average cost
- use a single stock pool per company
- block negative stock
- use reversal entries instead of editing automatic entries in place

## Database And Transaction Notes

Current code uses `Database.execute` over Drizzle. For posting logic that spans multiple inserts, add an explicit transaction path.

Recommended approach:

- expose a transaction helper from the database service
- persist sale, journal entry, lines, and stock movement atomically

The sale posting flow must not leave partially created data.

## Testing Priorities

When implementation starts, cover at least these cases.

1. service sale paid immediately
2. service sale on credit
3. product sale paid immediately with stock and CMV
4. product sale on credit with stock and CMV
5. mixed sale with service and product items
6. receipt of credit sale
7. unbalanced journal payload rejection
8. invalid account ownership rejection
9. negative stock rejection
10. over-receipt rejection

## Execution Notes For Future Contributors

Before implementing Workers-specific infrastructure, retrieve current Cloudflare docs.

When adding this accounting module:

- prefer incremental migrations
- keep each feature in its own folder under `apps/api/src/features`
- add DTOs in `packages/dto`
- keep controllers thin
- keep business rules in services
- add read APIs for the journal as part of the first usable release, not later
