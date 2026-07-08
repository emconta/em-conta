import type { AccountCategory, AccountNature } from "@api/db/schema";

export type AccountType =
  | "cash"
  | "bank_checking"
  | "short_term_investments"
  | "accounts_receivable"
  | "inventory"
  | "prepaid_expenses"
  | "fixed_assets"
  | "intangible_assets"
  | "accounts_payable"
  | "taxes_payable"
  | "salaries_payable"
  | "expenses_payable"
  | "loans_payable"
  | "long_term_debt"
  | "capital"
  | "retained_earnings"
  | "owner_withdrawals"
  | "sales_revenue"
  | "services_revenue"
  | "other_revenue"
  | "cogs"
  | "cost_of_services"
  | "operating_expenses"
  | "marketing_expenses"
  | "other_expenses";

export type AccountTerm = "current" | "non_current" | "n_a";
export type AccountDreGroup = "revenue" | "cogs" | "operating_expense" | "n_a";

type AccountTypeMetadata = {
  category: AccountCategory;
  nature: AccountNature;
  term: AccountTerm;
  dreGroup: AccountDreGroup;
  label: string;
};

export const ACCOUNT_TYPE_METADATA: Record<AccountType, AccountTypeMetadata> = {
  cash: {
    category: "assets",
    nature: "debit",
    term: "current",
    dreGroup: "n_a",
    label: "Caixa",
  },
  bank_checking: {
    category: "assets",
    nature: "debit",
    term: "current",
    dreGroup: "n_a",
    label: "Banco conta movimento",
  },
  short_term_investments: {
    category: "assets",
    nature: "debit",
    term: "current",
    dreGroup: "n_a",
    label: "Aplicações financeiras",
  },
  accounts_receivable: {
    category: "assets",
    nature: "debit",
    term: "current",
    dreGroup: "n_a",
    label: "Clientes a receber",
  },
  inventory: {
    category: "assets",
    nature: "debit",
    term: "current",
    dreGroup: "n_a",
    label: "Estoque",
  },
  prepaid_expenses: {
    category: "assets",
    nature: "debit",
    term: "current",
    dreGroup: "n_a",
    label: "Adiantamentos",
  },
  fixed_assets: {
    category: "assets",
    nature: "debit",
    term: "non_current",
    dreGroup: "n_a",
    label: "Ativos fixos",
  },
  intangible_assets: {
    category: "assets",
    nature: "debit",
    term: "non_current",
    dreGroup: "n_a",
    label: "Ativos intangíveis",
  },
  accounts_payable: {
    category: "liabilities",
    nature: "credit",
    term: "current",
    dreGroup: "n_a",
    label: "Fornecedores a pagar",
  },
  taxes_payable: {
    category: "liabilities",
    nature: "credit",
    term: "current",
    dreGroup: "n_a",
    label: "Impostos a recolher",
  },
  salaries_payable: {
    category: "liabilities",
    nature: "credit",
    term: "current",
    dreGroup: "n_a",
    label: "Pró-labore a pagar",
  },
  expenses_payable: {
    category: "liabilities",
    nature: "credit",
    term: "current",
    dreGroup: "n_a",
    label: "Despesas operacionais a pagar",
  },
  loans_payable: {
    category: "liabilities",
    nature: "credit",
    term: "current",
    dreGroup: "n_a",
    label: "Empréstimos",
  },
  long_term_debt: {
    category: "liabilities",
    nature: "credit",
    term: "non_current",
    dreGroup: "n_a",
    label: "Empréstimos longo prazo",
  },
  capital: {
    category: "equity",
    nature: "credit",
    term: "n_a",
    dreGroup: "n_a",
    label: "Capital social",
  },
  retained_earnings: {
    category: "equity",
    nature: "credit",
    term: "n_a",
    dreGroup: "n_a",
    label: "Lucros acumulados",
  },
  owner_withdrawals: {
    category: "equity",
    nature: "debit",
    term: "n_a",
    dreGroup: "n_a",
    label: "Retiradas do proprietário",
  },
  sales_revenue: {
    category: "revenue",
    nature: "credit",
    term: "n_a",
    dreGroup: "revenue",
    label: "Receita de vendas",
  },
  services_revenue: {
    category: "revenue",
    nature: "credit",
    term: "n_a",
    dreGroup: "revenue",
    label: "Receita de serviços",
  },
  other_revenue: {
    category: "revenue",
    nature: "credit",
    term: "n_a",
    dreGroup: "revenue",
    label: "Outras receitas",
  },
  cogs: {
    category: "expenses",
    nature: "debit",
    term: "n_a",
    dreGroup: "cogs",
    label: "Custo de mercadorias vendidas",
  },
  cost_of_services: {
    category: "expenses",
    nature: "debit",
    term: "n_a",
    dreGroup: "cogs",
    label: "Custo dos serviços prestados",
  },
  operating_expenses: {
    category: "expenses",
    nature: "debit",
    term: "n_a",
    dreGroup: "operating_expense",
    label: "Despesas operacionais",
  },
  marketing_expenses: {
    category: "expenses",
    nature: "debit",
    term: "n_a",
    dreGroup: "operating_expense",
    label: "Marketing",
  },
  other_expenses: {
    category: "expenses",
    nature: "debit",
    term: "n_a",
    dreGroup: "operating_expense",
    label: "Outras despesas",
  },
};

export function getAccountTypeMetadata(type: AccountType) {
  return ACCOUNT_TYPE_METADATA[type];
}

export function isCashOrBankType(type: AccountType) {
  return type === "cash" || type === "bank_checking";
}
