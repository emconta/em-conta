import type { AccountDto } from "@dto/accounts.dto";
import type {
  CreateManualJournalEntryDto,
  JournalEntryDetailDto,
  JournalEntryListItemDto,
} from "@dto/journal.dto";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
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
import { type ColumnDef, DataTable, type DataTableFilter } from "@web/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@web/components/ui/dialog";
import { Field, FieldLabel } from "@web/components/ui/field";
import { Input } from "@web/components/ui/input";
import LoadingButton from "@web/components/ui/loadingButton";
import { MoneyInput } from "@web/components/ui/masked-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@web/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@web/components/ui/table";
import { useAccounts } from "@web/features/accounts/accounts.queries";
import {
  listJournalEntriesOptions,
  useCreateManualJournalEntry,
  useJournalEntries,
  useJournalEntry,
} from "@web/features/journal/journal.queries";
import { PlusIcon, Trash2Icon } from "lucide-react";
import type * as React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type DraftLine = {
  key: string;
  accountId: string;
  amount: string;
  description: string;
  type: CreateManualJournalEntryDto["lines"][number]["type"];
};

const today = new Date().toISOString().slice(0, 10);

export default function JournalPage() {
  const queryClient = useQueryClient();
  const entries = useJournalEntries();
  const { isPending, mutateAsync } = useCreateManualJournalEntry();
  const [createOpen, setCreateOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const entryDetail = useJournalEntry(selectedEntryId);
  const [entryDate, setEntryDate] = useState(today);
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([newDraftLine("debit"), newDraftLine("credit")]);

  const entryList = entries.data?.isOk() ? entries.data.value : [];
  const selectedEntry = entryDetail.data?.isOk() ? entryDetail.data.value : null;
  const filteredEntries = entryList.filter((entry) => {
    const matchesSource = sourceFilter === "all" || entry.sourceType === sourceFilter;
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;

    return matchesSource && matchesStatus;
  });
  const totals = useMemo(() => sumLines(lines), [lines]);
  const isBalanced = totals.debit > 0 && totals.debit === totals.credit;
  const columns = useMemo<ColumnDef<JournalEntryListItemDto>[]>(
    () => [
      {
        accessorFn: (entry) => `#${entry.id}`,
        header: "Lançamento",
        cell: ({ row }) => <strong className="font-medium">#{row.original.id}</strong>,
      },
      {
        accessorFn: (entry) => new Date(entry.entryDate).toLocaleDateString("pt-BR"),
        header: "Data",
      },
      {
        accessorFn: (entry) => entry.memo ?? "Sem histórico",
        header: "Histórico",
      },
      {
        accessorFn: (entry) => sourceLabel(entry.sourceType),
        header: "Origem",
      },
      {
        accessorKey: "totalDebits",
        header: "Débitos",
        cell: ({ row }) => <span>R$ {row.original.totalDebits}</span>,
      },
      {
        accessorKey: "totalCredits",
        header: "Créditos",
        cell: ({ row }) => <span>R$ {row.original.totalCredits}</span>,
      },
      {
        accessorFn: (entry) => (entry.status === "posted" ? "Postado" : "Estornado"),
        header: "Status",
      },
    ],
    [],
  );
  const filters: DataTableFilter[] = [
    {
      id: "sourceType",
      label: "Origem",
      value: sourceFilter,
      onChange: setSourceFilter,
      options: [
        { label: "Todas", value: "all" },
        { label: "Manual", value: "manual" },
        { label: "Venda", value: "sale" },
        { label: "Estoque", value: "stock_issue" },
        { label: "Compra", value: "purchase" },
        { label: "Recebimento", value: "receipt" },
      ],
    },
    {
      id: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: "Todos", value: "all" },
        { label: "Postados", value: "posted" },
        { label: "Estornados", value: "void" },
      ],
    },
  ];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (lines.some((line) => !line.accountId)) {
      toast.error("Selecione uma conta para todas as partidas.");
      return;
    }

    const payload: CreateManualJournalEntryDto = {
      entryDate: new Date(`${entryDate}T12:00:00`).toISOString(),
      memo,
      lines: lines.map((line) => ({
        accountId: Number(line.accountId),
        amount: line.amount,
        description: line.description || null,
        type: line.type,
      })),
    };

    const result = await mutateAsync(payload);

    if (result.isErr()) {
      toast.error(journalErrorMessage(result.error.code));
      return;
    }

    toast.success(`Lançamento #${result.value.id} criado.`);
    setCreateOpen(false);
    setMemo("");
    setLines([newDraftLine("debit"), newDraftLine("credit")]);
    await queryClient.invalidateQueries({ queryKey: listJournalEntriesOptions.queryKey });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Partidas dobradas</p>
        <h1 className="text-2xl font-semibold tracking-tight">Lançamentos</h1>
      </section>

      <DataTable
        columns={columns}
        data={filteredEntries}
        emptyMessage="Nenhum lançamento criado ainda."
        filters={filters}
        getRowId={(entry) => String(entry.id)}
        isLoading={entries.isLoading}
        searchPlaceholder="Buscar por histórico, origem, data ou valor..."
        onRowClick={(entry) => setSelectedEntryId(entry.id)}
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            Novo lançamento
          </Button>
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
            <DialogDescription>
              Crie partidas dobradas manuais. Débitos e créditos precisam fechar antes de salvar.
            </DialogDescription>
          </DialogHeader>
          <JournalForm
            entryDate={entryDate}
            isBalanced={isBalanced}
            isPending={isPending}
            lines={lines}
            memo={memo}
            totals={totals}
            onEntryDateChange={setEntryDate}
            onLinesChange={setLines}
            onMemoChange={setMemo}
            onSubmit={submit}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectedEntryId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedEntryId(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEntryId ? `Lançamento #${selectedEntryId}` : "Detalhe do lançamento"}
            </DialogTitle>
            <DialogDescription>
              Partidas de débito e crédito do lançamento selecionado.
            </DialogDescription>
          </DialogHeader>
          <JournalDetail entry={selectedEntry} loading={entryDetail.isLoading} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JournalForm({
  entryDate,
  isBalanced,
  isPending,
  lines,
  memo,
  onEntryDateChange,
  onLinesChange,
  onMemoChange,
  onSubmit,
  totals,
}: {
  entryDate: string;
  isBalanced: boolean;
  isPending: boolean;
  lines: DraftLine[];
  memo: string;
  onEntryDateChange: (value: string) => void;
  onLinesChange: React.Dispatch<React.SetStateAction<DraftLine[]>>;
  onMemoChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  totals: { credit: number; debit: number };
}) {
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <Field>
          <FieldLabel htmlFor="journal-date">Data</FieldLabel>
          <Input
            id="journal-date"
            required
            type="date"
            value={entryDate}
            onChange={(event) => onEntryDateChange(event.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="journal-memo">Histórico</FieldLabel>
          <Input
            id="journal-memo"
            required
            value={memo}
            placeholder="Ex.: Capital inicial"
            onChange={(event) => onMemoChange(event.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium">Partidas</h3>
          <Button
            type="button"
            variant="outline"
            onClick={() => onLinesChange((current) => [...current, newDraftLine("debit")])}
          >
            <PlusIcon data-icon="inline-start" />
            Adicionar partida
          </Button>
        </div>

        {lines.map((line, index) => (
          <div
            key={line.key}
            className="grid gap-3 rounded-xl border bg-background p-3 md:grid-cols-[1fr_140px_140px_1fr_auto]"
          >
            <AccountCombobox
              accountId={line.accountId}
              onChange={(accountId) => updateLine(line.key, { accountId }, onLinesChange)}
            />

            <Field>
              <FieldLabel>Tipo</FieldLabel>
              <Select
                value={line.type}
                onValueChange={(value) =>
                  updateLine(
                    line.key,
                    { type: value as CreateManualJournalEntryDto["lines"][number]["type"] },
                    onLinesChange,
                  )
                }
              >
                <SelectTrigger size="sm" className="w-full" aria-label="Tipo da partida">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Débito</SelectItem>
                  <SelectItem value="credit">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Valor</FieldLabel>
              <MoneyInput
                aria-label={`Valor da partida ${index + 1}`}
                value={line.amount}
                onValueChange={(value) => updateLine(line.key, { amount: value }, onLinesChange)}
              />
            </Field>

            <Field>
              <FieldLabel>Descrição</FieldLabel>
              <Input
                value={line.description}
                placeholder="Opcional"
                onChange={(event) =>
                  updateLine(line.key, { description: event.target.value }, onLinesChange)
                }
              />
            </Field>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={lines.length === 2}
                aria-label={`Remover partida ${index + 1}`}
                onClick={() =>
                  onLinesChange((current) =>
                    current.filter((candidate) => candidate.key !== line.key),
                  )
                }
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div
        className="flex flex-col gap-3 rounded-xl bg-muted p-4 md:flex-row md:items-center md:justify-between"
        data-balanced={isBalanced}
      >
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <Summary label="Débitos" value={totals.debit} />
          <Summary label="Créditos" value={totals.credit} />
          <Summary label="Diferença" value={Math.abs(totals.debit - totals.credit)} />
        </div>
        <LoadingButton loading={isPending ? { text: "Salvando..." } : false}>
          Salvar lançamento
        </LoadingButton>
      </div>
    </form>
  );
}

function JournalDetail({
  entry,
  loading,
}: {
  entry: JournalEntryDetailDto | null;
  loading: boolean;
}) {
  if (loading) return <p className="text-sm text-muted-foreground">Carregando detalhe...</p>;
  if (!entry) return <p className="text-sm text-muted-foreground">Selecione um lançamento.</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-muted p-3">
        <div className="flex items-center justify-between gap-3">
          <strong>{entry.memo ?? "Sem histórico"}</strong>
          <span>{sourceLabel(entry.sourceType)}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(entry.entryDate).toLocaleDateString("pt-BR")}
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/70">
            <TableRow>
              <TableHead>Conta</TableHead>
              <TableHead className="text-right">Débito</TableHead>
              <TableHead className="text-right">Crédito</TableHead>
              <TableHead>Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entry.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="font-medium">{line.accountName}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {line.type === "debit" ? `R$ ${line.amount}` : ""}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {line.type === "credit" ? `R$ ${line.amount}` : ""}
                </TableCell>
                <TableCell className="text-muted-foreground">{line.description ?? "-"}</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 font-medium">
              <TableCell>Totais</TableCell>
              <TableCell className="text-right tabular-nums">R$ {entry.totalDebits}</TableCell>
              <TableCell className="text-right tabular-nums">R$ {entry.totalCredits}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground">{label}</span>
      <strong>R$ {formatMoney(value)}</strong>
    </div>
  );
}

type AccountGroup = {
  label: string;
  order: number;
  items: AccountDto[];
};

function AccountCombobox({
  accountId,
  onChange,
}: {
  accountId: string;
  onChange: (value: string) => void;
}) {
  const accounts = useAccountsList();
  const selectedAccount = accounts.find((account) => String(account.id) === accountId) ?? null;
  const groups = useMemo(() => groupAccounts(accounts), [accounts]);

  return (
    <Field>
      <FieldLabel>Conta</FieldLabel>
      <Combobox<AccountDto>
        items={groups}
        value={selectedAccount}
        itemToStringLabel={(item: AccountDto | AccountGroup) =>
          "items" in item ? item.label : accountSearchLabel(item)
        }
        onValueChange={(account) => onChange(account ? String(account.id) : "")}
      >
        <ComboboxInput placeholder="Selecione a conta" />
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
                          {account.nature === "debit" ? "Natureza devedora" : "Natureza credora"}
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
  );
}

function useAccountsList() {
  const accounts = useAccounts();
  return accounts.data?.isOk() ? accounts.data.value : [];
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

function newDraftLine(type: DraftLine["type"]): DraftLine {
  return {
    key: crypto.randomUUID(),
    accountId: "",
    amount: "0.00",
    description: "",
    type,
  };
}

function updateLine(
  key: string,
  patch: Partial<DraftLine>,
  setLines: React.Dispatch<React.SetStateAction<DraftLine[]>>,
) {
  setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
}

function sumLines(lines: DraftLine[]) {
  let credit = 0;
  let debit = 0;

  for (const line of lines) {
    const amount = Number(line.amount || 0);

    if (line.type === "debit") debit += amount;
    else credit += amount;
  }

  return { credit, debit };
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sourceLabel(sourceType: JournalEntryListItemDto["sourceType"]) {
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
  }
}

function journalErrorMessage(code: string) {
  switch (code) {
    case "COMPANY_NOT_FOUND":
      return "Finalize o onboarding antes de criar lançamentos.";
    case "EMPTY_LINES":
      return "Informe pelo menos duas partidas.";
    case "INVALID_ACCOUNT":
      return "Uma das contas selecionadas não pertence à empresa.";
    case "INVALID_AMOUNT":
      return "Todos os valores devem ser positivos.";
    case "INVALID_DATE":
      return "Informe uma data válida.";
    case "UNBALANCED_ENTRY":
      return "Total de débitos deve ser igual ao total de créditos.";
    default:
      return "Não foi possível criar o lançamento.";
  }
}
