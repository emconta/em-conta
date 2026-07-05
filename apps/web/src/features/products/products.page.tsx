import type { AccountDto } from "@dto/accounts.dto";
import type { CreateProductDto, CreateStockIntakeDto, ProductDto } from "@dto/products.dto";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import LoadingButton from "@web/components/ui/loadingButton";
import { useAccounts } from "@web/features/accounts/accounts.queries";
import {
  listProductsOptions,
  useCreateProduct,
  useCreateStockIntake,
  useProducts,
} from "@web/features/products/products.queries";
import { PlusIcon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { toast } from "sonner";

const emptyProduct: CreateProductDto = {
  name: "",
  type: "service",
  defaultSalePrice: "0.00",
  trackInventory: false,
  isActive: true,
};

const today = new Date().toISOString().slice(0, 10);

type StockIntakeDraft = Omit<CreateStockIntakeDto, "paymentAccountId"> & {
  paymentAccountId: string;
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const accounts = useAccounts();
  const products = useProducts();
  const { isPending, mutateAsync } = useCreateProduct();
  const createStockIntake = useCreateStockIntake();
  const [form, setForm] = useState<CreateProductDto>(emptyProduct);
  const [stockIntakes, setStockIntakes] = useState<Record<number, StockIntakeDraft>>({});

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = await mutateAsync(form);

    if (result.isErr()) {
      toast.error(productErrorMessage(result.error.code));
      return;
    }

    toast.success("Produto cadastrado.");
    setForm(emptyProduct);
    await queryClient.invalidateQueries({ queryKey: listProductsOptions.queryKey });
  }

  async function submitStockIntake(product: ProductDto, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const draft = stockIntakes[product.id] ?? emptyStockIntake();

    if (!draft.paymentAccountId) {
      toast.error("Selecione a conta de pagamento.");
      return;
    }

    const result = await createStockIntake.mutateAsync({
      productId: product.id,
      json: {
        date: new Date(`${draft.date}T12:00:00`).toISOString(),
        paymentAccountId: Number(draft.paymentAccountId),
        quantity: draft.quantity,
        unitCost: draft.unitCost,
      },
    });

    if (result.isErr()) {
      toast.error(productErrorMessage(result.error.code));
      return;
    }

    toast.success("Estoque atualizado.");
    setStockIntakes((current) => ({ ...current, [product.id]: emptyStockIntake() }));
    await queryClient.invalidateQueries({ queryKey: listProductsOptions.queryKey });
  }

  const productList = products.data?.isOk() ? products.data.value : [];
  const accountList = accounts.data?.isOk() ? accounts.data.value : [];
  const paymentAccounts = accountList.filter(
    (account) => account.key === "cash" || account.key === "bank_checking",
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Catálogo</p>
        <h1 className="text-2xl font-semibold tracking-tight">Produtos e serviços</h1>
      </section>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Novo item</CardTitle>
            <CardDescription>
              Use serviços e produtos sem estoque para testar vendas primeiro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={submit}>
              <Field label="Nome">
                <Input
                  required
                  value={form.name}
                  placeholder="Consultoria mensal"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Field>

              <Field label="Tipo">
                <select
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as CreateProductDto["type"],
                      trackInventory:
                        event.target.value === "product" ? current.trackInventory : false,
                    }))
                  }
                >
                  <option value="service">Serviço</option>
                  <option value="product">Produto</option>
                </select>
              </Field>

              <Field label="Preço padrão">
                <Input
                  required
                  inputMode="decimal"
                  value={form.defaultSalePrice}
                  placeholder="150.00"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, defaultSalePrice: event.target.value }))
                  }
                />
              </Field>

              {form.type === "product" ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(form.trackInventory)}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, trackInventory: event.target.checked }))
                    }
                  />
                  Controlar estoque
                </label>
              ) : null}

              <LoadingButton loading={isPending ? { text: "Cadastrando..." } : false}>
                <PlusIcon data-icon="inline-start" />
                Cadastrar item
              </LoadingButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens cadastrados</CardTitle>
            <CardDescription>{productList.length} item(ns) disponíveis para venda.</CardDescription>
          </CardHeader>
          <CardContent>
            {products.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : null}
            {products.data?.isErr() ? (
              <p className="text-sm text-destructive">Não foi possível carregar os produtos.</p>
            ) : null}
            <div className="flex flex-col gap-3">
              {productList.map((product) => (
                <div key={product.id} className="rounded-xl border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <strong className="font-medium">{product.name}</strong>
                      <span className="text-sm text-muted-foreground">
                        {product.type === "service" ? "Serviço" : "Produto"}
                        {product.trackInventory ? " com estoque" : " sem estoque"}
                      </span>
                    </div>
                    <span className="text-sm font-medium">R$ {product.defaultSalePrice}</span>
                  </div>
                  {product.trackInventory ? (
                    <StockIntakeForm
                      accounts={paymentAccounts}
                      draft={stockIntakes[product.id] ?? emptyStockIntake()}
                      isPending={createStockIntake.isPending}
                      product={product}
                      onChange={(draft) =>
                        setStockIntakes((current) => ({ ...current, [product.id]: draft }))
                      }
                      onSubmit={(event) => submitStockIntake(product, event)}
                    />
                  ) : null}
                </div>
              ))}
              {!products.isLoading && productList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum item cadastrado ainda.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StockIntakeForm({
  accounts,
  draft,
  isPending,
  onChange,
  onSubmit,
  product,
}: {
  accounts: AccountDto[];
  draft: StockIntakeDraft;
  isPending: boolean;
  onChange: (draft: StockIntakeDraft) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  product: ProductDto;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 border-t pt-3">
      <div className="grid gap-2 text-sm md:grid-cols-3">
        <StockMetric label="Qtd. atual" value={product.stock?.quantity ?? "0.000"} />
        <StockMetric label="Custo total" value={`R$ ${product.stock?.totalCost ?? "0.00"}`} />
        <StockMetric label="Custo médio" value={`R$ ${product.stock?.averageUnitCost ?? "0.00"}`} />
      </div>

      <form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1.4fr_auto]" onSubmit={onSubmit}>
        <Field label="Data">
          <Input
            required
            type="date"
            value={draft.date}
            onChange={(event) => onChange({ ...draft, date: event.target.value })}
          />
        </Field>
        <Field label="Quantidade">
          <Input
            required
            inputMode="decimal"
            value={draft.quantity}
            placeholder="10.000"
            onChange={(event) => onChange({ ...draft, quantity: event.target.value })}
          />
        </Field>
        <Field label="Custo unitário">
          <Input
            required
            inputMode="decimal"
            value={draft.unitCost}
            placeholder="25.00"
            onChange={(event) => onChange({ ...draft, unitCost: event.target.value })}
          />
        </Field>
        <Field label="Pagamento">
          <select
            required
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={draft.paymentAccountId}
            onChange={(event) => onChange({ ...draft, paymentAccountId: event.target.value })}
          >
            <option value="">Selecione</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-end">
          <Button type="submit" disabled={isPending}>
            Adicionar estoque
          </Button>
        </div>
      </form>
    </div>
  );
}

function StockMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <strong className="font-medium">{value}</strong>
    </div>
  );
}

function emptyStockIntake(): StockIntakeDraft {
  return {
    date: today,
    paymentAccountId: "",
    quantity: "0.000",
    unitCost: "0.00",
  };
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function productErrorMessage(code: string) {
  switch (code) {
    case "SERVICE_CANNOT_TRACK_STOCK":
      return "Serviços não podem controlar estoque.";
    case "COMPANY_NOT_FOUND":
      return "Finalize o onboarding antes de cadastrar itens.";
    case "INVALID_AMOUNT":
      return "Informe um custo unitário positivo.";
    case "INVALID_DATE":
      return "Informe uma data válida.";
    case "INVALID_PAYMENT_ACCOUNT":
      return "Selecione caixa ou banco como conta de pagamento.";
    case "INVALID_QUANTITY":
      return "Informe uma quantidade positiva.";
    case "INVENTORY_NOT_TRACKED":
      return "Este item não controla estoque.";
    case "MISSING_ACCOUNT":
      return "Conta de estoque não encontrada para a empresa.";
    case "PRODUCT_NOT_FOUND":
      return "Produto não encontrado.";
    default:
      return "Não foi possível cadastrar o item.";
  }
}
