import type { CreateProductDto } from "@dto/products.dto";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import LoadingButton from "@web/components/ui/loadingButton";
import {
  listProductsOptions,
  useCreateProduct,
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

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const products = useProducts();
  const { isPending, mutateAsync } = useCreateProduct();
  const [form, setForm] = useState<CreateProductDto>(emptyProduct);

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

  const productList = products.data?.isOk() ? products.data.value : [];

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
    default:
      return "Não foi possível cadastrar o item.";
  }
}
