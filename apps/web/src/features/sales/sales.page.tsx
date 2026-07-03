import type { CreateSaleDto, SaleDetailDto, SaleListItemDto } from "@dto/sales.dto";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import LoadingButton from "@web/components/ui/loadingButton";
import { Separator } from "@web/components/ui/separator";
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
  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);

        return sum + quantity * unitPrice;
      }, 0),
    [items],
  );

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
          <h1 className="text-2xl font-semibold tracking-tight">Criar venda</h1>
        </div>
        <Button variant="outline" asChild>
          <Link to="/dashboard/products">Cadastrar produto ou serviço</Link>
        </Button>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Nova venda</CardTitle>
            <CardDescription>
              Para testar agora, prefira serviços ou produtos sem estoque controlado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5" onSubmit={submit}>
              <div className="grid gap-4 md:grid-cols-4">
                <Field label="Data">
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(event) => setIssueDate(event.target.value)}
                  />
                </Field>

                <Field label="Pagamento">
                  <select
                    className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={paymentTerms}
                    onChange={(event) =>
                      setPaymentTerms(event.target.value as CreateSaleDto["paymentTerms"])
                    }
                  >
                    <option value="cash">À vista</option>
                    <option value="credit">A prazo</option>
                  </select>
                </Field>

                {paymentTerms === "cash" ? (
                  <Field label="Conta de recebimento">
                    <select
                      required
                      className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      value={cashAccountId}
                      onChange={(event) => setCashAccountId(event.target.value)}
                    >
                      <option value="">Selecione</option>
                      {cashAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}

                <Field label="Cliente">
                  <Input
                    value={customerName}
                    placeholder="Nome do cliente"
                    onChange={(event) => setCustomerName(event.target.value)}
                  />
                </Field>
              </div>

              <Field label="Descrição">
                <Input
                  value={description}
                  placeholder="Histórico da venda"
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>

              <Separator />

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-medium">Itens</h2>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setItems((current) => [...current, newDraftItem()])}
                  >
                    <PlusIcon data-icon="inline-start" />
                    Adicionar item
                  </Button>
                </div>

                {items.map((item, index) => (
                  <div
                    key={item.key}
                    className="grid gap-3 rounded-xl border bg-background p-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]"
                  >
                    <Field label="Item">
                      <select
                        required
                        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        value={item.productId}
                        onChange={(event) => selectProduct(item.key, event.target.value)}
                      >
                        <option value="">Selecione</option>
                        {productList.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} · {product.type === "service" ? "serviço" : "produto"}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Qtd.">
                      <Input
                        required
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(item.key, { quantity: event.target.value }, setItems)
                        }
                      />
                    </Field>

                    <Field label="Preço">
                      <Input
                        required
                        inputMode="decimal"
                        value={item.unitPrice}
                        onChange={(event) =>
                          updateItem(item.key, { unitPrice: event.target.value }, setItems)
                        }
                      />
                    </Field>

                    <Field label="Total">
                      <Input readOnly value={lineTotal(item)} />
                    </Field>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={items.length === 1}
                        aria-label={`Remover item ${index + 1}`}
                        onClick={() =>
                          setItems((current) =>
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
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <SalesList
            sales={saleList}
            selectedSaleId={selectedSaleId}
            onSelect={setSelectedSaleId}
          />
          <SaleDetail sale={selectedSale} loading={saleDetail.isLoading} />
        </div>
      </div>
    </div>
  );
}

function SalesList({
  onSelect,
  sales,
  selectedSaleId,
}: {
  onSelect: (id: number) => void;
  sales: SaleListItemDto[];
  selectedSaleId: number | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas recentes</CardTitle>
        <CardDescription>{sales.length} venda(s) lançadas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {sales.map((sale) => (
            <button
              key={sale.id}
              type="button"
              className="rounded-xl border bg-background p-3 text-left transition-colors hover:bg-muted data-[selected=true]:border-primary"
              data-selected={selectedSaleId === sale.id}
              onClick={() => onSelect(sale.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <strong className="font-medium">Venda #{sale.id}</strong>
                  <span className="text-sm text-muted-foreground">
                    {new Date(sale.issueDate).toLocaleDateString("pt-BR")} ·{" "}
                    {sale.paymentTerms === "cash" ? "à vista" : "a prazo"}
                  </span>
                </div>
                <span className="text-sm font-medium">R$ {sale.netAmount}</span>
              </div>
            </button>
          ))}

          {sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma venda lançada ainda.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SaleDetail({ loading, sale }: { loading: boolean; sale: SaleDetailDto | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhe da venda</CardTitle>
        <CardDescription>Use para conferir os itens após criar uma venda.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Carregando detalhe...</p> : null}
        {!loading && !sale ? (
          <p className="text-sm text-muted-foreground">Selecione uma venda.</p>
        ) : null}
        {sale ? (
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
        ) : null}
      </CardContent>
    </Card>
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
      return "Estoque insuficiente para vender este produto.";
    case "MISSING_ACCOUNT":
      return "O plano de contas não tem uma conta obrigatória para essa venda.";
    case "UNSUPPORTED_DISCOUNT":
      return "Desconto ainda não é suportado nessa versão.";
    default:
      return "Não foi possível criar a venda.";
  }
}
