import type { AccountDto } from "@dto/accounts.dto";
import type { AccountLedgerRowDto } from "@dto/ledger.dto";
import { AccountingHelp } from "@web/components/accounting-help";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@web/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@web/components/ui/table";
import { useAccounts } from "@web/features/accounts/accounts.queries";
import { useAccountLedger } from "@web/features/ledger/ledger.queries";
import { cn } from "@web/lib/utils";
import { Button } from "@web/components/ui/button";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useMemo, useState } from "react";

type AccountTreeNode = {
  id: number;
  name: string;
  code: string;
  category: AccountDto["category"];
  nature: AccountDto["nature"];
  type: AccountDto["type"];
  description: AccountDto["description"];
  depth: number;
  children: AccountTreeNode[];
};

const categoryOrder: AccountDto["category"][] = [
  "assets",
  "liabilities",
  "equity",
  "revenue",
  "expenses",
];

function categoryLabel(category: AccountDto["category"]) {
  switch (category) {
    case "assets":
      return "Ativo";
    case "liabilities":
      return "Passivo";
    case "equity":
      return "Patrimônio Líquido";
    case "revenue":
      return "Receitas";
    case "expenses":
      return "Despesas";
    default:
      return category;
  }
}

const accountTypeLabels: Record<string, string> = {
  cash: "Caixa",
  bank_checking: "Banco",
  short_term_investments: "Aplicações",
  accounts_receivable: "Clientes",
  inventory: "Estoque",
  prepaid_expenses: "Adiantamentos",
  fixed_assets: "Ativos fixos",
  intangible_assets: "Intangíveis",
  accounts_payable: "Fornecedores",
  taxes_payable: "Impostos",
  salaries_payable: "Pró-labore",
  expenses_payable: "Despesas a pagar",
  loans_payable: "Empréstimos",
  long_term_debt: "Dívida longo prazo",
  capital: "Capital",
  retained_earnings: "Lucros acumulados",
  owner_withdrawals: "Retiradas",
  sales_revenue: "Receita de vendas",
  services_revenue: "Receita de serviços",
  other_revenue: "Outras receitas",
  cogs: "CMV",
  cost_of_services: "Custo de serviços",
  operating_expenses: "Despesas operacionais",
  marketing_expenses: "Marketing",
  other_expenses: "Outras despesas",
};

const termLabels: Record<string, string> = {
  current: "Circulante",
  non_current: "Não circulante",
  n_a: "—",
};

const accountTypeTerms: Record<string, string> = {
  cash: "current",
  bank_checking: "current",
  short_term_investments: "current",
  accounts_receivable: "current",
  inventory: "current",
  prepaid_expenses: "current",
  fixed_assets: "non_current",
  intangible_assets: "non_current",
  accounts_payable: "current",
  taxes_payable: "current",
  salaries_payable: "current",
  expenses_payable: "current",
  loans_payable: "current",
  long_term_debt: "non_current",
  capital: "n_a",
  retained_earnings: "n_a",
  owner_withdrawals: "n_a",
  sales_revenue: "n_a",
  services_revenue: "n_a",
  other_revenue: "n_a",
  cogs: "n_a",
  cost_of_services: "n_a",
  operating_expenses: "n_a",
  marketing_expenses: "n_a",
  other_expenses: "n_a",
};

function accountTypeLabel(type: string) {
  return accountTypeLabels[type] ?? type;
}

function categoryNumber(category: AccountDto["category"]) {
  const index = categoryOrder.indexOf(category);

  return index >= 0 ? index + 1 : categoryOrder.length + 1;
}

function buildAccountTree(accounts: AccountDto[]): AccountTreeNode[] {
  const byId = new Map<number, AccountDto>();
  const childrenByParent = new Map<number | null, AccountDto[]>();

  for (const account of accounts) {
    byId.set(account.id, account);

    const siblings = childrenByParent.get(account.parentId ?? null) ?? [];
    siblings.push(account);
    childrenByParent.set(account.parentId ?? null, siblings);
  }

  function buildNode(account: AccountDto, code: string, depth: number): AccountTreeNode {
    const children = childrenByParent.get(account.id) ?? [];

    return {
      id: account.id,
      name: account.name,
      code,
      category: account.category,
      nature: account.nature,
      type: account.type,
      description: account.description,
      depth,
      children: children.map((child, index) => buildNode(child, `${code}.${index + 1}`, depth + 1)),
    };
  }

  const roots: AccountTreeNode[] = [];

  for (const category of categoryOrder) {
    const topLevel = (childrenByParent.get(null) ?? []).filter(
      (account) => account.category === category,
    );

    if (topLevel.length === 0) continue;

    const categoryCode = String(categoryNumber(category));

    roots.push({
      id: -categoryNumber(category),
      name: categoryLabel(category),
      code: categoryCode,
      category,
      nature: "debit",
      type: "",
      description: null,
      depth: 0,
      children: topLevel.map((account, index) =>
        buildNode(account, `${categoryCode}.${index + 1}`, 1),
      ),
    });
  }

  return roots;
}

function flattenVisibleNodes(nodes: AccountTreeNode[], expanded: Set<string>): AccountTreeNode[] {
  const result: AccountTreeNode[] = [];

  function walk(items: AccountTreeNode[]) {
    for (const item of items) {
      result.push(item);

      if (item.children.length > 0 && expanded.has(item.code)) {
        walk(item.children);
      }
    }
  }

  walk(nodes);

  return result;
}

export default function AccountsPage() {
  const accounts = useAccounts();
  const accountList = accounts.data?.isOk() ? accounts.data.value : [];
  const tree = useMemo(() => buildAccountTree(accountList), [accountList]);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();

    for (const category of tree) {
      initial.add(category.code);
    }

    return initial;
  });
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const selectedAccount = accountList.find((account) => account.id === selectedAccountId) ?? null;
  const ledger = useAccountLedger(selectedAccount ? selectedAccount.id : null);
  const ledgerData = ledger.data?.isOk() ? ledger.data.value : null;

  const visibleNodes = useMemo(() => flattenVisibleNodes(tree, expanded), [tree, expanded]);

  function toggle(code: string) {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }

      return next;
    });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Plano de contas</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Plano de Contas</h1>
            <AccountingHelp title="Plano de Contas">
              Lista organizada das contas usadas nos lançamentos. Clique em uma conta para ver o
              razão.
            </AccountingHelp>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setExpanded(new Set());
          }}
        >
          Recolher tudo
        </Button>
      </section>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/70 hover:bg-muted/70">
                <TableHead className="w-24 px-4 py-3">Código</TableHead>
                <TableHead className="px-4 py-3">Conta</TableHead>
                <TableHead className="px-4 py-3">Tipo</TableHead>
                <TableHead className="px-4 py-3">Prazo</TableHead>
                <TableHead className="px-4 py-3">Natureza</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.isLoading ? (
                <TableRow>
                  <TableCell className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : null}
              {!accounts.isLoading && visibleNodes.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                    Nenhuma conta encontrada.
                  </TableCell>
                </TableRow>
              ) : null}
              {!accounts.isLoading
                ? visibleNodes.map((node) => (
                    <TableRow
                      key={node.code}
                      className={cn(
                        "cursor-pointer",
                        node.id < 0 && "bg-muted/30 font-semibold hover:bg-muted/40",
                      )}
                      onClick={() => {
                        if (node.id >= 0) {
                          setSelectedAccountId(node.id);
                        }
                      }}
                    >
                      <TableCell className="px-4 py-3">
                        <div
                          className="flex items-center gap-1"
                          style={{ paddingLeft: `${node.depth * 1.5}rem` }}
                        >
                          {node.children.length > 0 ? (
                            <button
                              type="button"
                              className="inline-flex size-6 items-center justify-center rounded-md hover:bg-muted"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggle(node.code);
                              }}
                              aria-label={expanded.has(node.code) ? "Recolher" : "Expandir"}
                            >
                              {expanded.has(node.code) ? (
                                <ChevronDownIcon className="size-4" />
                              ) : (
                                <ChevronRightIcon className="size-4" />
                              )}
                            </button>
                          ) : (
                            <span className="size-6" />
                          )}
                          <span>{node.code}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div style={{ paddingLeft: `${node.depth * 1.5}rem` }}>
                          <span className={cn(node.id < 0 && "font-semibold")}>{node.name}</span>
                          {node.description ? (
                            <p className="text-xs text-muted-foreground">{node.description}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {node.id < 0 ? "—" : accountTypeLabel(node.type)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {node.id < 0 ? "—" : termLabels[accountTypeTerms[node.type] ?? "n_a"]}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {node.id < 0 ? "—" : node.nature === "debit" ? "Devedora" : "Credora"}
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        open={selectedAccountId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAccountId(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>
                {selectedAccount ? `${selectedAccount.name}` : "Movimentos da conta"}
              </DialogTitle>
              <AccountingHelp title="Razão da conta">
                Mostra os débitos, créditos e o saldo acumulado de uma conta, em ordem de data.
              </AccountingHelp>
            </div>
            <DialogDescription>
              {selectedAccount
                ? `Natureza ${selectedAccount.nature === "debit" ? "devedora" : "credora"} · Clique fora para fechar`
                : "Selecione uma conta para ver o razão."}
            </DialogDescription>
          </DialogHeader>
          <LedgerDetail data={ledgerData} loading={ledger.isLoading} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LedgerDetail({
  data,
  loading,
}: {
  data: {
    accountName: string;
    accountNature: string;
    openingBalance: string;
    rows: AccountLedgerRowDto[];
  } | null;
  loading: boolean;
}) {
  if (loading) return <p className="text-sm text-muted-foreground">Carregando movimentos...</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Nenhum movimento encontrado.</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-muted p-3">
        <strong className="font-medium">{data.accountName}</strong>
        <p className="text-sm text-muted-foreground">
          Natureza {data.accountNature === "debit" ? "devedora" : "credora"} · Saldo inicial{" "}
          {formatMoney(data.openingBalance)}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/70 hover:bg-muted/70">
                <TableHead className="px-4 py-3">Data</TableHead>
                <TableHead className="px-4 py-3">Histórico</TableHead>
                <TableHead className="px-4 py-3">Origem</TableHead>
                <TableHead className="px-4 py-3 text-right">Débito</TableHead>
                <TableHead className="px-4 py-3 text-right">Crédito</TableHead>
                <TableHead className="px-4 py-3 text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                    Nenhum movimento encontrado para esta conta.
                  </TableCell>
                </TableRow>
              ) : null}
              {data.rows.map((row, index) => (
                <TableRow key={row.entryId ?? `ledger-row-${index}`}>
                  <TableCell className="px-4 py-3">
                    {row.entryDate ? new Date(row.entryDate).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3">{row.memo ?? "—"}</TableCell>
                  <TableCell className="px-4 py-3">{sourceLabel(row.sourceType)}</TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    {row.debit !== "0.00" ? formatMoney(row.debit) : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    {row.credit !== "0.00" ? formatMoney(row.credit) : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">{formatMoney(row.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function formatMoney(value: string) {
  const numeric = Number(value);

  return numeric.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sourceLabel(sourceType: AccountLedgerRowDto["sourceType"]) {
  switch (sourceType) {
    case "manual":
      return "Manual";
    case "purchase":
      return "Compra";
    case "receipt":
      return "Recebimento";
    case "reversal":
      return "Estorno";
    case "sale":
      return "Venda";
    case "stock_issue":
      return "Baixa de estoque";
    default:
      return "—";
  }
}
