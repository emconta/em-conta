import type { AccountDto } from "@dto/accounts.dto";
import type {
  CreateManualJournalEntryDto,
  JournalEntryDetailDto,
  JournalEntryListItemDto,
} from "@dto/journal.dto";
import { useQueryClient } from "@tanstack/react-query";
import { AccountingHelp } from "@web/components/accounting-help";
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
import { DiscardChangesAlert } from "@web/components/ui/discard-changes-alert";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@web/components/ui/table";
import { useAccounts } from "@web/features/accounts/accounts.queries";
import { getLeafAccounts } from "@web/lib/accounts";
import {
  listJournalEntriesOptions,
  useCreateManualJournalEntry,
  useJournalEntries,
  useJournalEntry,
} from "@web/features/journal/journal.queries";
import { PlusIcon, Trash2Icon } from "lucide-react";
import type * as React from "react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type DraftLine = {
  key: string;
  accountId: string;
  creditAmount: string;
  debitAmount: string;
  description: string;
};

const today = new Date().toISOString().slice(0, 10);

export default function JournalPage() {
  const queryClient = useQueryClient();
  const entries = useJournalEntries();
  const { isPending, mutateAsync } = useCreateManualJournalEntry();
  const [createOpen, setCreateOpen] = useState(false);
  const [discardCreateOpen, setDiscardCreateOpen] = useState(false);
  const ignoreNextCreateCloseRef = useRef(false);
  const [sourceFilter, setSourceFilter] = useState("all");

  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const entryDetail = useJournalEntry(selectedEntryId);
  const [entryDate, setEntryDate] = useState(today);
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([newDraftLine()]);

  const entryList = entries.data?.isOk() ? entries.data.value : [];
  const selectedEntry = entryDetail.data?.isOk() ? entryDetail.data.value : null;
  const filteredEntries = entryList.filter((entry) => {
    const matchesSource = sourceFilter === "all" || entry.sourceType === sourceFilter;
    return matchesSource;
  });
  const totals = useMemo(() => sumLines(lines), [lines]);
  const filledLines = useMemo(() => lines.filter(isFilledLine), [lines]);
  const invalidLineCount = filledLines.filter((line) => !isValidLine(line)).length;
  const isBalanced = totals.debit > 0 && totals.debit === totals.credit;
  const canSubmit = filledLines.length >= 2 && invalidLineCount === 0 && isBalanced;
  const isCreateDirty =
    entryDate !== today ||
    memo !== "" ||
    lines.some((line) => line.accountId !== "" || isFilledLine(line));
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
  ];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (filledLines.length < 2) {
      toast.error("Informe pelo menos duas partidas com conta e valor.");
      return;
    }

    if (invalidLineCount > 0) {
      toast.error(
        "Cada partida precisa de uma conta e apenas um valor positivo em débito ou crédito.",
      );
      return;
    }

    if (!isBalanced) {
      toast.error("Total de débitos deve ser igual ao total de créditos.");
      return;
    }

    const payload: CreateManualJournalEntryDto = {
      entryDate: new Date(`${entryDate}T12:00:00`).toISOString(),
      memo,
      lines: filledLines.map((line) => toPayloadLine(line)),
    };

    const result = await mutateAsync(payload);

    if (result.isErr()) {
      toast.error(journalErrorMessage(result.error));
      return;
    }

    toast.success(`Lançamento #${result.value.id} criado.`);
    closeCreateDialog();
    await queryClient.invalidateQueries({ queryKey: listJournalEntriesOptions.queryKey });
  }

  function resetCreateForm() {
    setEntryDate(today);
    setMemo("");
    setLines([newDraftLine()]);
  }

  function closeCreateDialog() {
    setCreateOpen(false);
    resetCreateForm();
  }

  function handleCreateOpenChange(open: boolean) {
    if (open) {
      setCreateOpen(true);
      return;
    }

    if (ignoreNextCreateCloseRef.current || discardCreateOpen) {
      ignoreNextCreateCloseRef.current = false;
      return;
    }

    if (isCreateDirty) {
      setDiscardCreateOpen(true);
      return;
    }

    closeCreateDialog();
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Partidas dobradas</p>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Lançamentos</h1>
          <AccountingHelp title="Lançamentos contábeis">
            Cada fato tem débitos e créditos de mesmo valor. Use aqui também para representar contas
            a pagar simples.
          </AccountingHelp>
        </div>
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

      <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] overflow-hidden sm:max-w-5xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>Novo lançamento</DialogTitle>
              <AccountingHelp title="Débito e crédito">
                Débito e crédito são os dois lados do lançamento. O total dos débitos precisa ser
                igual ao total dos créditos.
              </AccountingHelp>
            </div>
            <DialogDescription>
              Crie partidas dobradas manuais. Débitos e créditos precisam fechar antes de salvar.
            </DialogDescription>
          </DialogHeader>
          <JournalForm
            entryDate={entryDate}
            canSubmit={canSubmit}
            invalidLineCount={invalidLineCount}
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

      <DiscardChangesAlert
        open={discardCreateOpen}
        onOpenChange={(open) => {
          if (!open) ignoreNextCreateCloseRef.current = true;
          setDiscardCreateOpen(open);
        }}
        onConfirm={() => {
          setDiscardCreateOpen(false);
          closeCreateDialog();
        }}
      />

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
  canSubmit,
  invalidLineCount,
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
  canSubmit: boolean;
  invalidLineCount: number;
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
    <form className="flex min-w-0 flex-col gap-5" onSubmit={onSubmit}>
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

      <div className="flex min-w-0 flex-col gap-3">
        <h3 className="font-medium">Partidas</h3>
        <div className="max-w-full overflow-x-auto rounded-xl border">
          <Table className="min-w-[760px] table-fixed lg:min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[330px]">Conta</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[140px]">Débito</TableHead>
                <TableHead className="w-[140px]">Crédito</TableHead>
                <TableHead className="w-14 text-right">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, index) =>
                isBlankLine(line) ? (
                  <TableRow key={line.key} className="border-b-0 hover:bg-transparent">
                    <TableCell colSpan={5} className="align-top">
                      <div className="w-[314px] max-w-full">
                        <AccountCombobox
                          accountId={line.accountId}
                          label={`Adicionar partida ${index + 1}`}
                          placeholder="Adicionar uma linha"
                          onChange={(accountId) =>
                            updateLine(
                              line.key,
                              {
                                accountId,
                                description:
                                  accountId && line.description.trim() === "" && memo.trim() !== ""
                                    ? memo
                                    : line.description,
                              },
                              onLinesChange,
                            )
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={line.key} className="border-b-0 hover:bg-transparent">
                    <TableCell className="align-top">
                      <AccountCombobox
                        accountId={line.accountId}
                        label={`Conta da partida ${index + 1}`}
                        placeholder="Selecione a conta"
                        onChange={(accountId) =>
                          updateLine(
                            line.key,
                            {
                              accountId,
                              description:
                                accountId && line.description.trim() === "" && memo.trim() !== ""
                                  ? memo
                                  : line.description,
                            },
                            onLinesChange,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Field>
                        <FieldLabel className="sr-only">
                          Descrição da partida {index + 1}
                        </FieldLabel>
                        <Input
                          value={line.description}
                          placeholder={memo || "Opcional"}
                          onChange={(event) =>
                            updateLine(line.key, { description: event.target.value }, onLinesChange)
                          }
                        />
                      </Field>
                    </TableCell>
                    <TableCell className="align-top">
                      <Field>
                        <FieldLabel className="sr-only">Débito da partida {index + 1}</FieldLabel>
                        <MoneyInput
                          aria-label={`Débito da partida ${index + 1}`}
                          maskLazy
                          placeholder="R$ 0,00"
                          value={line.debitAmount}
                          onValueChange={(value) =>
                            updateLine(
                              line.key,
                              {
                                creditAmount: value === "" ? line.creditAmount : "",
                                debitAmount: value,
                              },
                              onLinesChange,
                            )
                          }
                        />
                      </Field>
                    </TableCell>
                    <TableCell className="align-top">
                      <Field>
                        <FieldLabel className="sr-only">Crédito da partida {index + 1}</FieldLabel>
                        <MoneyInput
                          aria-label={`Crédito da partida ${index + 1}`}
                          maskLazy
                          placeholder="R$ 0,00"
                          value={line.creditAmount}
                          onValueChange={(value) =>
                            updateLine(
                              line.key,
                              {
                                creditAmount: value,
                                debitAmount: value === "" ? line.debitAmount : "",
                              },
                              onLinesChange,
                            )
                          }
                        />
                      </Field>
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Remover partida ${index + 1}`}
                        onClick={() =>
                          onLinesChange((current) =>
                            ensureTrailingBlank(
                              current.filter((candidate) => candidate.key !== line.key),
                            ),
                          )
                        }
                      >
                        <Trash2Icon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ),
              )}
              <TableRow className="border-t-2 font-medium hover:bg-transparent">
                <TableCell colSpan={2}>Totais</TableCell>
                <TableCell className="text-right tabular-nums">
                  R$ {formatMoney(totals.debit)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  R$ {formatMoney(totals.credit)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <div
        className="flex flex-col gap-3 rounded-xl bg-muted p-4 md:flex-row md:items-center md:justify-between"
        data-balanced={isBalanced}
      >
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <Summary label="Débitos" value={totals.debit} />
          <Summary label="Créditos" value={totals.credit} />
          <Summary label="Diferença" value={Math.abs(totals.debit - totals.credit)} />
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Estado</span>
            <strong className={canSubmit ? "text-emerald-700" : "text-destructive"}>
              {canSubmit ? "Fechado" : validationMessage(totals, invalidLineCount)}
            </strong>
          </div>
        </div>
        <LoadingButton disabled={!canSubmit} loading={isPending ? { text: "Salvando..." } : false}>
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
  label = "Conta",
  onChange,
  placeholder = "Selecione a conta",
}: {
  accountId: string;
  label?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const accounts = useAccountsList();
  const selectedAccount = accounts.find((account) => String(account.id) === accountId) ?? null;
  const groups = useMemo(() => groupAccounts(accounts), [accounts]);

  return (
    <Field>
      <FieldLabel className="sr-only">{label}</FieldLabel>
      <Combobox<AccountDto>
        items={groups}
        value={selectedAccount}
        itemToStringLabel={(item: AccountDto | AccountGroup) =>
          "items" in item ? item.label : accountSearchLabel(item)
        }
        onValueChange={(account) => onChange(account ? String(account.id) : "")}
      >
        <ComboboxInput placeholder={placeholder} />
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
                          {account.typeLabel ? ` · ${account.typeLabel}` : ""}
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
  return accounts.data?.isOk() ? getLeafAccounts(accounts.data.value) : [];
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
      return { label: "Patrimônio Líquido", order: 3 };
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
  const nature = account.nature === "debit" ? "Devedora" : "Credora";

  return [account.name, category, nature, account.typeLabel].filter(Boolean).join(" ");
}

function newDraftLine(): DraftLine {
  return {
    key: crypto.randomUUID(),
    accountId: "",
    creditAmount: "",
    debitAmount: "",
    description: "",
  };
}

function updateLine(
  key: string,
  patch: Partial<DraftLine>,
  setLines: React.Dispatch<React.SetStateAction<DraftLine[]>>,
) {
  setLines((current) =>
    ensureTrailingBlank(current.map((line) => (line.key === key ? { ...line, ...patch } : line))),
  );
}

function sumLines(lines: DraftLine[]) {
  let credit = 0;
  let debit = 0;

  for (const line of lines) {
    debit += Number(line.debitAmount || 0);
    credit += Number(line.creditAmount || 0);
  }

  return { credit, debit };
}

function ensureTrailingBlank(lines: DraftLine[]) {
  return [...lines.filter(isFilledLine), newDraftLine()];
}

function isBlankLine(line: DraftLine) {
  return (
    line.accountId === "" &&
    line.creditAmount === "" &&
    line.debitAmount === "" &&
    line.description.trim() === ""
  );
}

function isFilledLine(line: DraftLine) {
  return !isBlankLine(line);
}

function isValidLine(line: DraftLine) {
  const debit = Number(line.debitAmount || 0);
  const credit = Number(line.creditAmount || 0);
  const hasDebit = debit > 0;
  const hasCredit = credit > 0;

  return line.accountId !== "" && hasDebit !== hasCredit;
}

function toPayloadLine(line: DraftLine): CreateManualJournalEntryDto["lines"][number] {
  const debit = Number(line.debitAmount || 0);
  const credit = Number(line.creditAmount || 0);

  if (!isValidLine(line)) {
    throw new Error("Invalid journal line cannot be converted to payload.");
  }

  const type = debit > 0 ? "debit" : "credit";

  return {
    accountId: Number(line.accountId),
    amount: type === "debit" ? debit.toFixed(2) : credit.toFixed(2),
    description: line.description || null,
    type,
  };
}

function validationMessage(totals: { credit: number; debit: number }, invalidLineCount: number) {
  if (invalidLineCount > 0) return "Revise as partidas";
  if (totals.debit === 0 && totals.credit === 0) return "Informe as partidas";

  return `Diferença de R$ ${formatMoney(Math.abs(totals.debit - totals.credit))}`;
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
    case "sale":
      return "Venda";
    case "stock_issue":
      return "Baixa de estoque";
  }
}

function journalErrorMessage(error: {
  accountName?: string | null;
  code: string;
  shortfall?: string | null;
}) {
  switch (error.code) {
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
    case "INSUFFICIENT_BALANCE":
      return insufficientBalanceMessage(error);
    case "UNBALANCED_ENTRY":
      return "Total de débitos deve ser igual ao total de créditos.";
    default:
      return "Não foi possível criar o lançamento.";
  }
}

function insufficientBalanceMessage(error: {
  accountName?: string | null;
  shortfall?: string | null;
}) {
  const account = error.accountName ?? "conta de caixa/banco";
  const shortfall = error.shortfall ? ` Faltam R$ ${error.shortfall}.` : "";

  return `Saldo insuficiente em ${account}.${shortfall}`;
}
