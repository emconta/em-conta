import "dotenv/config";

import Database from "@api/db/database";
import { companies, user } from "@api/db/schema";
import { seedSimpleAccountsChart } from "@api/db/seeds/accountsCharts.seed";
import type { AccountType } from "@api/features/accounts/accountTypes";
import AccountsRepo from "@api/features/accounts/accounts.repo";
import { AccountsService } from "@api/features/accounts/accounts.service";
import CompaniesRepo from "@api/features/companies/companies.repo";
import { JournalService } from "@api/features/journal/journal.service";
import AccountsChartsRepo from "@api/features/accountsCharts/accountsCharts.repo";
import OnboardingService from "@api/features/onboarding/onboarding.service";
import { ProductsService } from "@api/features/products/products.service";
import { ReceiptsService } from "@api/features/receipts/receipts.service";
import { SalesService } from "@api/features/sales/sales.service";
import { makeRuntime } from "@api/runtime";
import { Effect } from "effect";

const connectionString = process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE;

if (!connectionString) {
  throw new Error(
    "Missing CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE in environment.",
  );
}

const env = {
  HYPERDRIVE: {
    connectionString,
  },
  CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE: connectionString,
  CORS_ORIGINS: process.env.CORS_ORIGINS ?? "http://localhost:5173",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:8787",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "demo-secret",
  INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET ?? "demo-internal-secret",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI ?? "",
} as Cloudflare.Env;

const { runtime } = makeRuntime(env);

function getDemoUser() {
  return Effect.gen(function* () {
    const db = yield* Database;

    const existing = yield* db.execute((q) => q.query.user.findFirst());

    if (existing) {
      yield* Effect.logInfo(`Using existing user ${existing.email} (${existing.id})`);
      return existing;
    }

    const now = new Date();
    const id = crypto.randomUUID();

    const rows = yield* db.execute((q) =>
      q
        .insert(user)
        .values({
          id,
          name: "Maria Demo",
          email: "maria@demo.emconta",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
    );

    const created = rows[0];

    if (!created) {
      return yield* Effect.fail(new Error("Demo user insert returned no rows."));
    }

    yield* Effect.logInfo(`Created demo user ${created.email} (${created.id})`);
    return created;
  });
}

function getOrCreateDemoCompany(userId: string) {
  return Effect.gen(function* () {
    const companiesRepo = yield* CompaniesRepo;

    const existing = yield* companiesRepo.getFromUser({ userId });

    if (existing) {
      yield* Effect.logInfo(`Using existing company ${existing.name} (${existing.id})`);
      return existing;
    }

    const company = yield* OnboardingService.finish({
      userId,
      name: "Maria MEI Demo",
      cnpj: null,
    });

    yield* Effect.logInfo(`Created demo company ${company.name} (${company.id})`);
    return company;
  });
}

function ensureCompanyAccounts(companyId: number) {
  return Effect.gen(function* () {
    const accountsRepo = yield* AccountsRepo;
    const accountsChartsRepo = yield* AccountsChartsRepo;

    const existingAccounts = yield* accountsRepo.listByCompany({ companyId });

    if (existingAccounts.length > 0) {
      yield* Effect.logInfo(
        `Company ${companyId} already has ${existingAccounts.length} accounts.`,
      );
      return;
    }

    const chart = yield* accountsChartsRepo.getFirst();

    if (!chart) {
      return yield* Effect.fail(new Error("No accounts chart found to seed company accounts."));
    }

    yield* AccountsService.createFromChart({ chartId: chart.id, companyId });
    yield* Effect.logInfo(`Created accounts from chart for company ${companyId}.`);
  });
}

function requireAccountId(accountsByType: Map<AccountType, number>, type: AccountType) {
  const id = accountsByType.get(type);

  if (!id) {
    return Effect.fail(new Error(`Demo seed requires an account of type "${type}".`));
  }

  return Effect.succeed(id);
}

const seedDemoData = Effect.gen(function* () {
  yield* seedSimpleAccountsChart;

  const demoUser = yield* getDemoUser();
  const company = yield* getOrCreateDemoCompany(demoUser.id);

  yield* ensureCompanyAccounts(company.id);

  const existingProduct = yield* Effect.gen(function* () {
    const db = yield* Database;
    return yield* db.execute((q) =>
      q.query.products.findFirst({
        where(fields, operators) {
          return operators.eq(fields.companyId, company.id);
        },
      }),
    );
  });

  if (existingProduct) {
    yield* Effect.logInfo(
      `Company ${company.id} already has products; demo seed skipped to avoid duplicates.`,
    );

    return {
      companyId: company.id,
      userId: demoUser.id,
      seeded: false,
    };
  }

  const accounts = yield* AccountsService.listForUser({ userId: demoUser.id });
  const accountsByType = new Map(accounts.map((account) => [account.type, account.id]));

  const cashId = yield* requireAccountId(accountsByType, "cash");
  const capitalId = yield* requireAccountId(accountsByType, "capital");
  const operatingExpensesId = yield* requireAccountId(accountsByType, "operating_expenses");

  yield* Effect.logInfo("Creating initial capital entry (R$ 50.000,00)");

  yield* JournalService.createManualForUser({
    userId: demoUser.id,
    entryDate: "2026-07-01T12:00:00.000Z",
    memo: "Aporte inicial do socio",
    lines: [
      { accountId: cashId, type: "debit", amount: "50000.00", description: null },
      { accountId: capitalId, type: "credit", amount: "50000.00", description: null },
    ],
  });

  yield* Effect.logInfo("Creating demo products and services");

  const notebook = yield* ProductsService.createForUser({
    userId: demoUser.id,
    name: "Notebook",
    type: "product",
    defaultSalePrice: "3500.00",
    trackInventory: true,
  });

  const consulting = yield* ProductsService.createForUser({
    userId: demoUser.id,
    name: "Consultoria de TI",
    type: "service",
    defaultSalePrice: "800.00",
  });

  yield* Effect.logInfo("Purchasing 20 notebooks at R$ 2.000,00 each");

  yield* ProductsService.createStockIntakeForUser({
    userId: demoUser.id,
    productId: notebook.id,
    date: "2026-07-02T12:00:00.000Z",
    quantity: "20.000",
    unitCost: "2000.00",
    paymentAccountId: cashId,
  });

  yield* Effect.logInfo("Creating cash sale: 2 notebooks");

  const cashSale = yield* SalesService.createForUser({
    userId: demoUser.id,
    paymentTerms: "cash",
    issueDate: "2026-07-05T12:00:00.000Z",
    cashAccountId: cashId,
    customerName: "Joao Cliente",
    description: null,
    items: [{ productId: notebook.id, quantity: "2.000", description: null }],
  });

  yield* Effect.logInfo("Creating credit sale: 1 notebook + 5 consulting hours");

  const creditSale = yield* SalesService.createForUser({
    userId: demoUser.id,
    paymentTerms: "credit",
    issueDate: "2026-07-06T12:00:00.000Z",
    customerName: "Ana Cliente",
    description: null,
    items: [
      { productId: notebook.id, quantity: "1.000", description: null },
      { productId: consulting.id, quantity: "5.000", description: null },
    ],
  });

  yield* Effect.logInfo("Receiving R$ 3.500,00 from credit sale");

  yield* ReceiptsService.createForUser({
    userId: demoUser.id,
    saleId: creditSale.saleId,
    receiptDate: "2026-07-10T12:00:00.000Z",
    amount: "3500.00",
    cashAccountId: cashId,
    notes: "Primeira parcela",
  });

  yield* Effect.logInfo("Recording operating expense: rent");

  yield* JournalService.createManualForUser({
    userId: demoUser.id,
    entryDate: "2026-07-15T12:00:00.000Z",
    memo: "Aluguel do escritorio",
    lines: [
      { accountId: operatingExpensesId, type: "debit", amount: "1200.00", description: null },
      { accountId: cashId, type: "credit", amount: "1200.00", description: null },
    ],
  });

  yield* Effect.logInfo("Demo seed complete.");

  return {
    companyId: company.id,
    userId: demoUser.id,
    seeded: true,
    cashSaleId: cashSale.saleId,
    creditSaleId: creditSale.saleId,
  };
});

runtime
  .runPromise(seedDemoData)
  .then((result) => {
    console.log("Seed result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
