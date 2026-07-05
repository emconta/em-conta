import type { CreateSaleDto, SaleDetailDto, SaleListItemDto } from "@dto/sales.dto";
import type { ProductDto } from "@dto/products.dto";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
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
import { MoneyInput, QuantityInput } from "@web/components/ui/masked-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@web/components/ui/select";
import { Separator } from "@web/components/ui/separator";
import LoadingButton from "@web/components/ui/loadingButton";
import { useAccounts } from "@web/features/accounts/accounts.queries";
import { useProducts } from "@web/features/products/products.queries";
import {
  listSalesOptions,
  useCreateSale,
  useSale,
  useSales,
} from "@web/features/sales/sales.queries";
import { PlusIcon, Trash2Icon } from "lucide-react";
import type * as React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type SaleDraftItem = {
  key: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  description: string;
};

const today = new Date().toISOString().slice(0, 10);

export default function SalesPage() {
  const queryClient = useQueryClient();
  const accounts = useAccounts();
  const products = useProducts();
  const sales = useSales();
  const { isPending, mutateAsync } = useCreateSale();
  const [createOpen, setCreateOpen] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const saleDetail = useSale(selectedSaleId);
  const [paymentTerms, setPaymentTerms] = useState<CreateSaleDto["paymentTerms"]>("cash");
  const [issueDate, setIssueDate] = useState(today);
  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [cashAccountId, setCashAccountId] = useState("");
  const [items, setItems] = useState<SaleDraftItem[]>([newDraftItem()]);

  const productList = products.data?.isOk() ? products.data.value : [];
  const accountList = accounts.data?.isOk() ? accounts.data.value : [];
  const saleList = sales.data?.isOk() ? sales.data.value : [];
  const cashAccounts = accountList.filter(
    (account) => account.key === "cash" || account.key === "bank_checking",
  );
  const selectedSale = saleDetail.data?.isOk() ? saleDetail.data.value : null;
  const filteredSales = saleList.filter(
    (sale) => paymentFilter === "all" || sale.paymentTerms === paymentFilter,
  );
  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);

        return sum + quantity * unitPrice;
      }, 0),
    [items],
  );

  const columns = useMemo<ColumnDef<SaleListItemDto>[]>(
    () => [
      {
        accessorFn: (sale) => `Venda #${sale.id}`,
        header: "Venda",
        cell: ({ row }) => <strong className="font-medium">Venda #{row.original.id}</strong>,
      },
      {
        accessorFn: (sale) => new Date(sale.issueDate).toLocaleDateString("pt-BR"),
        header: "Data",
      },
      {
        accessorFn: (sale) => sale.customerName ?? "Cliente não informado",
        header: "Cliente",
      },
      {
        accessorFn: (sale) => (sale.paymentTerms === "cash" ? "À vista" : "A prazo"),
        header: "Pagamento",
      },
      {
        accessorKey: "netAmount",
        header: "Total",
        cell: ({ row }) => <span className="font-medium">R$ {row.original.netAmount}</span>,
      },
      {
        accessorFn: (sale) => (sale.status === "posted" ? "Postada" : "Estornada"),
        header: "Status",
      },
    ],
    [],
  );
  const filters: DataTableFilter[] = [
    {
      id: "paymentTerms",
      label: "Pagamento",
      value: paymentFilter,
      onChange: setPaymentFilter,
      options: [
        { label: "Todos", value: "all" },
        { label: "À vista", value: "cash" },
        { label: "A prazo", value: "credit" },
      ],
    },
  ];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CreateSaleDto = {
      paymentTerms,
      issueDate: new Date(`${issueDate}T12:00:00`).toISOString(),
      description: description || null,
      customerName: customerName || null,
      cashAccountId: paymentTerms === "cash" ? Number(cashAccountId) : undefined,
      items: items.map((item) => ({
        productId: Number(item.productId),
        quantity: item.quantity,
        unitPrice: item.unitPrice || undefined,
        description: item.description || null,
      })),
    };

    const result = await mutateAsync(payload);

    if (result.isErr()) {
      toast.error(saleErrorMessage(result.error.code));
      return;
    }

    toast.success(`Venda #${result.value.saleId} criada.`);
    setSelectedSaleId(result.value.saleId);
    setCreateOpen(false);
    setItems([newDraftItem()]);
    setCustomerName("");
    setDescription("");
    await queryClient.invalidateQueries({ queryKey: listSalesOptions.queryKey });
  }

  function selectProduct(itemKey: string, productId: string) {
    const product = productList.find((candidate) => String(candidate.id) === productId);

    setItems((current) =>
      current.map((item) =>
        item.key === itemKey
          ? {
              ...item,
              productId,
              unitPrice: product?.defaultSalePrice ?? item.unitPrice,
              description: product?.name ?? item.description,
            }
          : item,
      ),
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Vendas</p>
          <h1 className="text-2xl font-semibold tracking-tight">Vendas</h1>
        </div>
      </section>

      <DataTable
        columns={columns}
        data={filteredSales}
        emptyMessage="Nenhuma venda lançada ainda."
        filters={filters}
        getRowId={(sale) => String(sale.id)}
        isLoading={sales.isLoading}
        searchPlaceholder="Buscar por venda, cliente, data ou status..."
        onRowClick={(sale) => setSelectedSaleId(sale.id)}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/dashboard/products">Cadastrar produto/serviço</Link>
            </Button>
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              Nova venda
            </Button>
          </>
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nova venda</DialogTitle>
            <DialogDescription>
              Crie vendas à vista ou a prazo. Cadastre produtos/serviços antes se eles ainda não
              aparecerem na lista.
            </DialogDescription>
          </DialogHeader>
          <SaleForm
            cashAccountId={cashAccountId}
            cashAccounts={cashAccounts}
            customerName={customerName}
            description={description}
            isPending={isPending}
            issueDate={issueDate}
            items={items}
            paymentTerms={paymentTerms}
            productList={productList}
            total={total}
            onAddItem={() => setItems((current) => [...current, newDraftItem()])}
            onCashAccountChange={setCashAccountId}
            onCustomerNameChange={setCustomerName}
            onDescriptionChange={setDescription}
            onIssueDateChange={setIssueDate}
            onPaymentTermsChange={setPaymentTerms}
            onProductChange={selectProduct}
            onSubmit={submit}
            onUpdateItems={setItems}
          />
        </DialogContent>
      </Dialog>

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
            <DialogDescription>Detalhes da venda e itens lançados.</DialogDescription>
          </DialogHeader>
          <SaleDetail sale={selectedSale} loading={saleDetail.isLoading} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SaleForm({
  cashAccountId,
  cashAccounts,
  customerName,
  description,
  isPending,
  issueDate,
  items,
  onAddItem,
  onCashAccountChange,
  onCustomerNameChange,
  onDescriptionChange,
  onIssueDateChange,
  onPaymentTermsChange,
  onProductChange,
  onSubmit,
  onUpdateItems,
  paymentTerms,
  productList,
  total,
}: {
  cashAccountId: string;
  cashAccounts: { id: number; name: string }[];
  customerName: string;
  description: string;
  isPending: boolean;
  issueDate: string;
  items: SaleDraftItem[];
  onAddItem: () => void;
  onCashAccountChange: (value: string) => void;
  onCustomerNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIssueDateChange: (value: string) => void;
  onPaymentTermsChange: (value: CreateSaleDto["paymentTerms"]) => void;
  onProductChange: (itemKey: string, productId: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateItems: React.Dispatch<React.SetStateAction<SaleDraftItem[]>>;
  paymentTerms: CreateSaleDto["paymentTerms"];
  productList: ProductDto[];
  total: number;
}) {
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-4">
        <Field>
          <FieldLabel htmlFor="sale-date">Data</FieldLabel>
          <Input
            id="sale-date"
            type="date"
            value={issueDate}
            onChange={(event) => onIssueDateChange(event.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>Pagamento</FieldLabel>
          <Select
            value={paymentTerms}
            onValueChange={(value) => onPaymentTermsChange(value as CreateSaleDto["paymentTerms"])}
          >
            <SelectTrigger size="sm" className="w-full" aria-label="Condição de pagamento">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">À vista</SelectItem>
              <SelectItem value="credit">A prazo</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {paymentTerms === "cash" ? (
          <Field>
            <FieldLabel>Conta de recebimento</FieldLabel>
            <Select value={cashAccountId} onValueChange={onCashAccountChange}>
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
        ) : null}

        <Field>
          <FieldLabel htmlFor="sale-customer">Cliente</FieldLabel>
          <Input
            id="sale-customer"
            value={customerName}
            placeholder="Nome do cliente"
            onChange={(event) => onCustomerNameChange(event.target.value)}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="sale-description">Descrição</FieldLabel>
        <Input
          id="sale-description"
          value={description}
          placeholder="Histórico da venda"
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </Field>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium">Itens</h3>
          <Button type="button" variant="outline" onClick={onAddItem}>
            <PlusIcon data-icon="inline-start" />
            Adicionar item
          </Button>
        </div>

        {items.map((item, index) => (
          <div
            key={item.key}
            className="grid gap-3 rounded-xl border bg-background p-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]"
          >
            <Field>
              <FieldLabel>Item</FieldLabel>
              <Select
                value={item.productId}
                onValueChange={(value) => onProductChange(item.key, value)}
              >
                <SelectTrigger size="sm" className="w-full" aria-label={`Item ${index + 1}`}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {productList.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name} · {product.type === "service" ? "serviço" : "produto"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Qtd.</FieldLabel>
              <QuantityInput
                aria-label={`Quantidade do item ${index + 1}`}
                value={item.quantity}
                onValueChange={(value) => updateItem(item.key, { quantity: value }, onUpdateItems)}
              />
            </Field>

            <Field>
              <FieldLabel>Preço</FieldLabel>
              <MoneyInput
                aria-label={`Preço unitário do item ${index + 1}`}
                value={item.unitPrice}
                onValueChange={(value) => updateItem(item.key, { unitPrice: value }, onUpdateItems)}
              />
            </Field>

            <Field>
              <FieldLabel>Total</FieldLabel>
              <Input readOnly value={`R$ ${lineTotal(item)}`} />
            </Field>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={items.length === 1}
                aria-label={`Remover item ${index + 1}`}
                onClick={() =>
                  onUpdateItems((current) =>
                    current.filter((candidate) => candidate.key !== item.key),
                  )
                }
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-muted p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Total da venda</span>
          <strong className="text-2xl">R$ {formatMoney(total)}</strong>
        </div>
        <LoadingButton loading={isPending ? { text: "Criando venda..." } : false}>
          Criar venda
        </LoadingButton>
      </div>
    </form>
  );
}

function SaleDetail({ loading, sale }: { loading: boolean; sale: SaleDetailDto | null }) {
  if (loading) return <p className="text-sm text-muted-foreground">Carregando detalhe...</p>;
  if (!sale) return <p className="text-sm text-muted-foreground">Selecione uma venda.</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-muted p-3">
        <div className="flex items-center justify-between gap-3">
          <strong>Venda #{sale.id}</strong>
          <span>R$ {sale.netAmount}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {sale.customerName || "Cliente não informado"}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {sale.items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm"
          >
            <div className="flex flex-col gap-1">
              <strong className="font-medium">{item.description}</strong>
              <span className="text-muted-foreground">
                {item.quantity} x R$ {item.unitPrice}
              </span>
            </div>
            <span>R$ {item.lineAmount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function newDraftItem(): SaleDraftItem {
  return {
    key: crypto.randomUUID(),
    productId: "",
    quantity: "1.000",
    unitPrice: "0.00",
    description: "",
  };
}

function updateItem(
  key: string,
  patch: Partial<SaleDraftItem>,
  setItems: React.Dispatch<React.SetStateAction<SaleDraftItem[]>>,
) {
  setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
}

function lineTotal(item: SaleDraftItem) {
  return formatMoney(Number(item.quantity || 0) * Number(item.unitPrice || 0));
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function saleErrorMessage(code: string) {
  switch (code) {
    case "MISSING_CASH_ACCOUNT":
      return "Escolha uma conta de caixa ou banco para venda à vista.";
    case "INVALID_CASH_ACCOUNT":
      return "A conta selecionada não é caixa ou banco.";
    case "PRODUCT_NOT_FOUND":
      return "Um dos itens selecionados não está disponível.";
    case "NEGATIVE_STOCK":
      return "Estoque insuficiente: reduza a quantidade ou adicione estoque antes de vender.";
    case "MISSING_ACCOUNT":
      return "O plano de contas não tem uma conta obrigatória para essa venda.";
    case "UNSUPPORTED_DISCOUNT":
      return "Desconto ainda não é suportado nessa versão.";
    default:
      return "Não foi possível criar a venda.";
  }
}
