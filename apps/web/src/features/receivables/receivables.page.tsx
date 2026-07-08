import type { ReceivableItemDto } from "@dto/receivables.dto";
import { useQueryClient } from "@tanstack/react-query";
import { AccountingHelp } from "@web/components/accounting-help";
import { getLeafCashBankAccounts } from "@web/lib/accounts";
import { Button } from "@web/components/ui/button";
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
import { MoneyInput } from "@web/components/ui/masked-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@web/components/ui/select";
import LoadingButton from "@web/components/ui/loadingButton";
import { useAccounts } from "@web/features/accounts/accounts.queries";
import {
  listReceivablesOptions,
  listReceiptsOptions,
  useReceivables,
  useReceipts,
} from "@web/features/receivables/receivables.queries";
import { useCreateReceipt } from "@web/features/receipts/receipts.queries";
import { PlusIcon } from "lucide-react";
import type * as React from "react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function ReceivablesPage() {
  const queryClient = useQueryClient();
  const accounts = useAccounts();
  const receivables = useReceivables();
  const receipts = useReceipts();
  const { isPending, mutateAsync } = useCreateReceipt();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [discardCreateOpen, setDiscardCreateOpen] = useState(false);
  const ignoreNextCreateCloseRef = useRef(false);
  const [receiptSaleId, setReceiptSaleId] = useState<number | null>(null);
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptCashAccountId, setReceiptCashAccountId] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");

  const receivableList = receivables.data?.isOk() ? receivables.data.value : [];
  const receiptList = receipts.data?.isOk() ? receipts.data.value : [];
  const accountList = accounts.data?.isOk() ? accounts.data.value : [];
  const cashAccounts = getLeafCashBankAccounts(accountList);

  const filteredReceivables = receivableList.filter((item) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return Number(item.outstandingAmount) > 0;
    if (statusFilter === "settled") return Number(item.outstandingAmount) === 0;
    return true;
  });

  const selectedReceipts = selectedSaleId
    ? receiptList.filter((r) => r.saleId === selectedSaleId)
    : [];
  const today = new Date().toISOString().slice(0, 10);
  const isCreateDirty =
    receiptDate !== today ||
    receiptAmount !== "" ||
    receiptCashAccountId !== "" ||
    receiptNotes !== "";

  const columns = useMemo<ColumnDef<ReceivableItemDto>[]>(
    () => [
      {
        accessorFn: (item) => `Venda #${item.saleId}`,
        header: "Venda",
        cell: ({ row }) => <strong className="font-medium">Venda #{row.original.saleId}</strong>,
      },
      {
        accessorFn: (item) => new Date(item.issueDate).toLocaleDateString("pt-BR"),
        header: "Data",
      },
      {
        accessorFn: (item) => item.customerName ?? "Cliente não informado",
        header: "Cliente",
      },
      {
        accessorKey: "netAmount",
        header: "Total",
        cell: ({ row }) => <span className="font-medium">R$ {row.original.netAmount}</span>,
      },
      {
        accessorKey: "receivedAmount",
        header: "Recebido",
        cell: ({ row }) => <span>R$ {row.original.receivedAmount}</span>,
      },
      {
        accessorKey: "outstandingAmount",
        header: "Pendente",
        cell: ({ row }) => {
          const outstanding = Number(row.original.outstandingAmount);

          return (
            <span
              className={outstanding > 0 ? "text-destructive font-medium" : "text-muted-foreground"}
            >
              R$ {row.original.outstandingAmount}
            </span>
          );
        },
      },
      {
        accessorKey: "receiptCount",
        header: "Recebimentos",
      },
    ],
    [],
  );

  const filters: DataTableFilter[] = [
    {
      id: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: "Todos", value: "all" },
        { label: "Pendente", value: "pending" },
        { label: "Quitado", value: "settled" },
      ],
    },
  ];

  async function handleCreateReceipt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!receiptSaleId) return;

    const result = await mutateAsync({
      saleId: receiptSaleId,
      receiptDate: new Date(`${receiptDate}T12:00:00`).toISOString(),
      amount: receiptAmount,
      cashAccountId: Number(receiptCashAccountId),
      notes: receiptNotes || null,
    });

    if (result.isErr()) {
      toast.error(receiptErrorMessage(result.error.code));
      return;
    }

    toast.success("Recebimento registrado.");
    closeCreateDialog();
    await queryClient.invalidateQueries({ queryKey: listReceiptsOptions.queryKey });
    await queryClient.invalidateQueries({ queryKey: listReceivablesOptions.queryKey });
  }

  function resetCreateForm() {
    setReceiptSaleId(null);
    setReceiptDate(today);
    setReceiptAmount("");
    setReceiptCashAccountId("");
    setReceiptNotes("");
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

  function openReceiptDialog(saleId: number) {
    const receivable = receivableList.find((r) => r.saleId === saleId);

    if (receivable && Number(receivable.outstandingAmount) <= 0) {
      toast.info("Esta venda já foi quitada.");
      return;
    }

    setReceiptSaleId(saleId);
    setReceiptDate(today);
    setCreateOpen(true);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Contas a receber</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Contas a Receber</h1>
            <AccountingHelp title="Contas a receber">
              Valores de vendas a prazo que ainda precisam entrar no caixa ou banco.
            </AccountingHelp>
          </div>
        </div>
      </section>

      <DataTable
        columns={columns}
        data={filteredReceivables}
        emptyMessage="Nenhuma venda a prazo encontrada."
        filters={filters}
        getRowId={(item) => String(item.saleId)}
        isLoading={receivables.isLoading}
        searchPlaceholder="Buscar por venda, cliente ou data..."
        onRowClick={(item) => setSelectedSaleId(item.saleId)}
        actions={
          <Button
            type="button"
            disabled={selectedSaleId === null}
            onClick={() => {
              if (selectedSaleId !== null) openReceiptDialog(selectedSaleId);
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Novo recebimento
          </Button>
        }
      />

      <Dialog
        open={selectedSaleId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSaleId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedSaleId ? `Venda #${selectedSaleId}` : "Detalhe da venda"}
            </DialogTitle>
            <DialogDescription>Recebimentos vinculados a esta venda.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {selectedReceipts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum recebimento registrado para esta venda.
              </p>
            ) : (
              selectedReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <div className="flex flex-col gap-1">
                    <strong className="font-medium">
                      {new Date(receipt.receiptDate).toLocaleDateString("pt-BR")}
                    </strong>
                    {receipt.notes ? (
                      <span className="text-muted-foreground">{receipt.notes}</span>
                    ) : null}
                  </div>
                  <span className="font-medium">R$ {receipt.amount}</span>
                </div>
              ))
            )}
            {selectedSaleId &&
            Number(
              receivableList.find((r) => r.saleId === selectedSaleId)?.outstandingAmount ?? "0",
            ) > 0 ? (
              <Button
                type="button"
                onClick={() => {
                  openReceiptDialog(selectedSaleId);
                }}
              >
                <PlusIcon data-icon="inline-start" />
                Registrar recebimento
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>Novo recebimento</DialogTitle>
              <AccountingHelp title="Recebimento">
                Quita parte ou todo o saldo pendente e transfere o valor para caixa ou banco.
              </AccountingHelp>
            </div>
            <DialogDescription>Registre o recebimento de uma venda a prazo.</DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleCreateReceipt}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="receipt-date">Data</FieldLabel>
                <Input
                  id="receipt-date"
                  type="date"
                  value={receiptDate}
                  onChange={(event) => setReceiptDate(event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Conta de recebimento</FieldLabel>
                <Select value={receiptCashAccountId} onValueChange={setReceiptCashAccountId}>
                  <SelectTrigger size="sm" className="w-full" aria-label="Conta de recebimento">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashAccounts.map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel>Valor</FieldLabel>
              <MoneyInput
                aria-label="Valor do recebimento"
                value={receiptAmount}
                onValueChange={setReceiptAmount}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="receipt-notes">Observações</FieldLabel>
              <Input
                id="receipt-notes"
                value={receiptNotes}
                placeholder="Opcional"
                onChange={(event) => setReceiptNotes(event.target.value)}
              />
            </Field>

            <div className="flex justify-end">
              <LoadingButton loading={isPending ? { text: "Registrando..." } : false}>
                Registrar recebimento
              </LoadingButton>
            </div>
          </form>
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
    </div>
  );
}

function receiptErrorMessage(code: string) {
  switch (code) {
    case "INVALID_AMOUNT":
      return "Valor inválido.";
    case "INVALID_CASH_ACCOUNT":
      return "Conta de caixa ou banco inválida.";
    case "OVER_RECEIPT":
      return "Valor excede o saldo pendente da venda.";
    case "SALE_NOT_FOUND":
      return "Venda não encontrada.";
    case "SALE_NOT_ON_CREDIT":
      return "Esta venda não é a prazo.";
    default:
      return "Não foi possível registrar o recebimento.";
  }
}
