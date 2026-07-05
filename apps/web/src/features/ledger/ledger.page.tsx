import type { AccountDto } from "@dto/accounts.dto";
import type { AccountLedgerRowDto } from "@dto/ledger.dto";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@web/components/ui/combobox";
import { type ColumnDef, DataTable } from "@web/components/ui/data-table";
import { Field, FieldLabel } from "@web/components/ui/field";
import { useAccounts } from "@web/features/accounts/accounts.queries";
import { useAccountLedger } from "@web/features/ledger/ledger.queries";
import { useMemo, useState } from "react";

type AccountGroup = {
  label: string;
  order: number;
  items: AccountDto[];
};

export default function LedgerPage() {
  const accounts = useAccounts();
  const accountList = accounts.data?.isOk() ? accounts.data.value : [];
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const selectedAccount =
    accountList.find((account) => String(account.id) === selectedAccountId) ?? null;
  const ledger = useAccountLedger(selectedAccount ? selectedAccount.id : null);
  const ledgerData = ledger.data?.isOk() ? ledger.data.value : null;

  const groups = useMemo(() => groupAccounts(accountList), [accountList]);

  const columns = useMemo<ColumnDef<AccountLedgerRowDto>[]>(
    () => [
      {
        accessorFn: (row) =>
          row.entryDate ? new Date(row.entryDate).toLocaleDateString("pt-BR") : "—",
        header: "Data",
      },
      {
        accessorFn: (row) => row.memo ?? "—",
        header: "Histórico",
      },
      {
        accessorFn: (row) => (row.sourceType ? sourceLabel(row.sourceType) : "—"),
        header: "Origem",
      },
      {
        accessorKey: "debit",
        header: "Débito",
        cell: ({ row }) => (row.original.debit !== "0.00" ? formatMoney(row.original.debit) : "—"),
      },
      {
        accessorKey: "credit",
        header: "Crédito",
        cell: ({ row }) =>
          row.original.credit !== "0.00" ? formatMoney(row.original.credit) : "—",
      },
      {
        accessorKey: "balance",
        header: "Saldo",
        cell: ({ row }) => formatMoney(row.original.balance),
      },
    ],
    [],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Movimentos por conta</p>
        <h1 className="text-2xl font-semibold tracking-tight">Razão</h1>
      </section>

      <div className="flex flex-col gap-4 rounded-2xl bg-background p-4 ring-1 ring-border">
        <Field className="md:max-w-md">
          <FieldLabel>Conta</FieldLabel>
          <Combobox
            items={groups}
            value={selectedAccount}
            itemToStringLabel={(item: AccountDto | AccountGroup) =>
              "items" in item ? item.label : accountSearchLabel(item)
            }
            onValueChange={(account) => setSelectedAccountId(account ? String(account.id) : "")}
          >
            <ComboboxInput placeholder="Selecione uma conta para ver o razão" />
            <ComboboxContent>
              <ComboboxEmpty>Nenhuma conta encontrada.</ComboboxEmpty>
              <ComboboxList>
                {(group: AccountGroup) => (
                  <ComboboxGroup key={group.label} items={group.items}>
                    <ComboboxLabel>{group.label}</ComboboxLabel>
                    <ComboboxCollection>
                      {(account: AccountDto) => (
                        <ComboboxItem key={account.id} value={account}>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate">{account.name}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {account.nature === "debit"
                                ? "Natureza devedora"
                                : "Natureza credora"}
                              {account.key ? ` · ${account.key}` : ""}
                            </span>
                          </span>
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxGroup>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>

        {selectedAccount && ledgerData ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl bg-muted p-3">
              <strong className="font-medium">{ledgerData.accountName}</strong>
              <p className="text-sm text-muted-foreground">
                Natureza {ledgerData.accountNature === "debit" ? "devedora" : "credora"} · Saldo
                inicial {formatMoney(ledgerData.openingBalance)}
              </p>
            </div>

            <DataTable
              columns={columns}
              data={ledgerData.rows}
              emptyMessage="Nenhum movimento encontrado para esta conta."
              isLoading={ledger.isLoading}
              searchPlaceholder="Buscar por data, histórico ou origem..."
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function groupAccounts(accounts: AccountDto[]) {
  const groups = new Map<string, AccountGroup>();

  for (const account of accounts) {
    const metadata = accountCategoryMetadata(account.category);
    const group = groups.get(metadata.label) ?? {
      items: [],
      label: metadata.label,
      order: metadata.order,
    };

    group.items.push(account);
    groups.set(metadata.label, group);
  }

  return Array.from(groups.values())
    .sort((a, b) => a.order - b.order)
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    }));
}

function accountCategoryMetadata(category: string) {
  switch (category) {
    case "assets":
      return { label: "Ativo", order: 1 };
    case "liabilities":
      return { label: "Passivo", order: 2 };
    case "equity":
      return { label: "Patrimônio líquido", order: 3 };
    case "revenue":
      return { label: "Receitas", order: 4 };
    case "expenses":
      return { label: "Despesas", order: 5 };
    default:
      return { label: "Outras contas", order: 99 };
  }
}

function accountSearchLabel(account: AccountDto) {
  const category = accountCategoryMetadata(account.category).label;

  return [account.name, category, account.nature, account.key].filter(Boolean).join(" ");
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
