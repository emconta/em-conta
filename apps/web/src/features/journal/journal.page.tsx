import { Combobox } from "@base-ui/react/combobox";
import type { AccountDto } from "@dto/accounts.dto";
import type { CreateManualJournalEntryDto } from "@dto/journal.dto";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import LoadingButton from "@web/components/ui/loadingButton";
import { useAccounts } from "@web/features/accounts/accounts.queries";
import {
  listJournalEntriesOptions,
  useCreateManualJournalEntry,
  useJournalEntries,
} from "@web/features/journal/journal.queries";
import { cn } from "@web/lib/utils";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
  const accounts = useAccounts();
  const entries = useJournalEntries();
  const { isPending, mutateAsync } = useCreateManualJournalEntry();
  const [entryDate, setEntryDate] = useState(today);
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([newDraftLine("debit"), newDraftLine("credit")]);

  const accountList = accounts.data?.isOk() ? accounts.data.value : [];
  const entryList = entries.data?.isOk() ? entries.data.value : [];
  const totals = useMemo(() => sumLines(lines), [lines]);
  const isBalanced = totals.debit > 0 && totals.debit === totals.credit;

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
    setMemo("");
    setLines([newDraftLine("debit"), newDraftLine("credit")]);
    await queryClient.invalidateQueries({ queryKey: listJournalEntriesOptions.queryKey });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Partidas dobradas</p>
        <h1 className="text-2xl font-semibold tracking-tight">Novo lançamento</h1>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Lançamento manual</CardTitle>
            <CardDescription>
              O total de débitos deve ser igual ao total de créditos antes de salvar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5" onSubmit={submit}>
              <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                <Field label="Data">
                  <Input
                    required
                    type="date"
                    value={entryDate}
                    onChange={(event) => setEntryDate(event.target.value)}
                  />
                </Field>

                <Field label="Histórico">
                  <Input
                    required
                    value={memo}
                    placeholder="Ex.: Capital inicial"
                    onChange={(event) => setMemo(event.target.value)}
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-medium">Partidas</h2>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLines((current) => [...current, newDraftLine("debit")])}
                  >
                    <PlusIcon data-icon="inline-start" />
                    Adicionar partida
                  </Button>
                </div>

                {lines.map((line, index) => (
                  <div
                    key={line.key}
                    className="grid gap-3 rounded-xl border bg-background p-3 md:grid-cols-[1fr_130px_130px_1fr_auto]"
                  >
                    <AccountCombobox
                      accounts={accountList}
                      label="Conta"
                      value={line.accountId}
                      onChange={(accountId) => updateLine(line.key, { accountId }, setLines)}
                    />

                    <Field label="Tipo">
                      <select
                        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        value={line.type}
                        onChange={(event) =>
                          updateLine(
                            line.key,
                            {
                              type: event.target
                                .value as CreateManualJournalEntryDto["lines"][number]["type"],
                            },
                            setLines,
                          )
                        }
                      >
                        <option value="debit">Débito</option>
                        <option value="credit">Crédito</option>
                      </select>
                    </Field>

                    <Field label="Valor">
                      <Input
                        required
                        inputMode="decimal"
                        value={line.amount}
                        placeholder="1000.00"
                        onChange={(event) =>
                          updateLine(line.key, { amount: event.target.value }, setLines)
                        }
                      />
                    </Field>

                    <Field label="Descrição">
                      <Input
                        value={line.description}
                        placeholder="Opcional"
                        onChange={(event) =>
                          updateLine(line.key, { description: event.target.value }, setLines)
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
                          setLines((current) =>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lançamentos recentes</CardTitle>
            <CardDescription>{entryList.length} lançamento(s) encontrados.</CardDescription>
          </CardHeader>
          <CardContent>
            {entries.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : null}
            {entries.data?.isErr() ? (
              <p className="text-sm text-destructive">Não foi possível carregar lançamentos.</p>
            ) : null}
            <div className="flex flex-col gap-2">
              {entryList.slice(0, 8).map((entry) => (
                <div key={entry.id} className="rounded-xl border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <strong className="font-medium">
                        #{entry.id} · {entry.memo}
                      </strong>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.entryDate).toLocaleDateString("pt-BR")} · {entry.sourceType}
                      </span>
                    </div>
                    <span className="text-sm font-medium">R$ {entry.totalDebits}</span>
                  </div>
                </div>
              ))}
              {!entries.isLoading && entryList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lançamento criado ainda.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
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
  accounts,
  label,
  onChange,
  value,
}: {
  accounts: AccountDto[];
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const selectedAccount = accounts.find((account) => String(account.id) === value) ?? null;
  const groups = useMemo(() => groupAccounts(accounts), [accounts]);

  return (
    <div className="flex flex-col gap-2">
      <Combobox.Root
        items={groups}
        value={selectedAccount}
        itemToStringLabel={(item: AccountDto | AccountGroup) =>
          "items" in item ? item.label : accountSearchLabel(item)
        }
        onValueChange={(account) => onChange(account ? String(account.id) : "")}
      >
        <Combobox.Label className="flex items-center gap-2 text-sm leading-none font-medium select-none">
          {label}
        </Combobox.Label>
        <Combobox.Trigger
          className={cn(
            "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            !selectedAccount && "text-muted-foreground",
          )}
        >
          <span className="truncate">{selectedAccount?.name ?? "Selecione"}</span>
          <Combobox.Icon>
            <ChevronsUpDownIcon />
          </Combobox.Icon>
        </Combobox.Trigger>

        <Combobox.Portal>
          <Combobox.Positioner align="start" sideOffset={4}>
            <Combobox.Popup
              className="min-w-[var(--anchor-width)] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-md"
              aria-label="Selecionar conta"
            >
              <Combobox.Input
                className="h-9 w-full border-b bg-background px-3 text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Buscar conta..."
              />
              <div className="max-h-72 overflow-y-auto p-1">
                <Combobox.Empty>
                  <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                    Nenhuma conta encontrada.
                  </div>
                </Combobox.Empty>
                <Combobox.List>
                  {(group: AccountGroup) => (
                    <Combobox.Group key={group.label} items={group.items} className="py-1">
                      <Combobox.GroupLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        {group.label}
                      </Combobox.GroupLabel>
                      <Combobox.Collection>
                        {(account: AccountDto) => (
                          <Combobox.Item
                            key={account.id}
                            value={account}
                            className={cn(
                              "flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none",
                              "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
                            )}
                          >
                            <Combobox.ItemIndicator className="flex size-4 items-center justify-center text-primary">
                              <CheckIcon />
                            </Combobox.ItemIndicator>
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate">{account.name}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {account.nature === "debit"
                                  ? "Natureza devedora"
                                  : "Natureza credora"}
                                {account.key ? ` · ${account.key}` : ""}
                              </span>
                            </span>
                          </Combobox.Item>
                        )}
                      </Combobox.Collection>
                    </Combobox.Group>
                  )}
                </Combobox.List>
              </div>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
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
