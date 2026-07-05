import type { AccountDto } from "@dto/accounts.dto";
import type { CreateProductDto, CreateStockIntakeDto, ProductDto } from "@dto/products.dto";
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
import { Switch } from "@web/components/ui/switch";
import LoadingButton from "@web/components/ui/loadingButton";
import { useAccounts } from "@web/features/accounts/accounts.queries";
import {
  listProductsOptions,
  useCreateProduct,
  useCreateStockIntake,
  useProducts,
} from "@web/features/products/products.queries";
import { PackagePlusIcon, PlusIcon } from "lucide-react";
import type * as React from "react";
import { useMemo, useState } from "react";
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
  const [createOpen, setCreateOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<ProductDto | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [inventoryFilter, setInventoryFilter] = useState("all");
  const [form, setForm] = useState<CreateProductDto>(emptyProduct);
  const [stockIntake, setStockIntake] = useState<StockIntakeDraft>(emptyStockIntake());

  const productList = products.data?.isOk() ? products.data.value : [];
  const accountList = accounts.data?.isOk() ? accounts.data.value : [];
  const paymentAccounts = accountList.filter(
    (account) => account.key === "cash" || account.key === "bank_checking",
  );
  const filteredProducts = productList.filter((product) => {
    const matchesType = typeFilter === "all" || product.type === typeFilter;
    const matchesInventory =
      inventoryFilter === "all" ||
      (inventoryFilter === "tracked" && product.trackInventory) ||
      (inventoryFilter === "not-tracked" && !product.trackInventory);

    return matchesType && matchesInventory;
  });

  const columns = useMemo<ColumnDef<ProductDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Item",
        cell: ({ row }) => <strong className="font-medium">{row.original.name}</strong>,
      },
      {
        accessorFn: (product) => (product.type === "service" ? "Serviço" : "Produto"),
        header: "Tipo",
      },
      {
        accessorFn: (product) => (product.trackInventory ? "Sim" : "Não"),
        header: "Estoque",
      },
      {
        accessorKey: "defaultSalePrice",
        header: "Preço padrão",
        cell: ({ row }) => <span>R$ {row.original.defaultSalePrice}</span>,
      },
      {
        accessorFn: (product) => product.stock?.quantity ?? "-",
        header: "Qtd. atual",
      },
      {
        accessorFn: (product) => product.stock?.averageUnitCost ?? "-",
        header: "Custo médio",
        cell: ({ row }) =>
          row.original.stock ? <span>R$ {row.original.stock.averageUnitCost}</span> : <span>-</span>,
      },
      {
        accessorFn: (product) => product.stock?.totalCost ?? "-",
        header: "Custo total",
        cell: ({ row }) =>
          row.original.stock ? <span className="font-medium">R$ {row.original.stock.totalCost}</span> : <span>-</span>,
      },
    ],
    [],
  );
  const filters: DataTableFilter[] = [
    {
      id: "type",
      label: "Tipo",
      value: typeFilter,
      onChange: setTypeFilter,
      options: [
        { label: "Todos", value: "all" },
        { label: "Produtos", value: "product" },
        { label: "Serviços", value: "service" },
      ],
    },
    {
      id: "inventory",
      label: "Controle de estoque",
      value: inventoryFilter,
      onChange: setInventoryFilter,
      options: [
        { label: "Todos", value: "all" },
        { label: "Controla estoque", value: "tracked" },
        { label: "Não controla", value: "not-tracked" },
      ],
    },
  ];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = await mutateAsync(form);

    if (result.isErr()) {
      toast.error(productErrorMessage(result.error.code));
      return;
    }

    toast.success("Produto cadastrado.");
    setCreateOpen(false);
    setForm(emptyProduct);
    await queryClient.invalidateQueries({ queryKey: listProductsOptions.queryKey });
  }

  async function submitStockIntake(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stockProduct) return;

    if (!stockIntake.paymentAccountId) {
      toast.error("Selecione a conta de pagamento.");
      return;
    }

    const result = await createStockIntake.mutateAsync({
      productId: stockProduct.id,
      json: {
        date: new Date(`${stockIntake.date}T12:00:00`).toISOString(),
        paymentAccountId: Number(stockIntake.paymentAccountId),
        quantity: stockIntake.quantity,
        unitCost: stockIntake.unitCost,
      },
    });

    if (result.isErr()) {
      toast.error(productErrorMessage(result.error.code));
      return;
    }

    toast.success("Estoque atualizado.");
    setStockProduct(null);
    setStockIntake(emptyStockIntake());
    await queryClient.invalidateQueries({ queryKey: listProductsOptions.queryKey });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Catálogo e estoque</p>
        <h1 className="text-2xl font-semibold tracking-tight">Produtos e serviços</h1>
      </section>

      <DataTable
        columns={columns}
        data={filteredProducts}
        emptyMessage="Nenhum item cadastrado ainda."
        filters={filters}
        getRowId={(product) => String(product.id)}
        isLoading={products.isLoading}
        searchPlaceholder="Buscar por nome, tipo ou estoque..."
        onRowClick={(product) => {
          if (product.trackInventory) setStockProduct(product);
        }}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={!productList.some((product) => product.trackInventory)}
              onClick={() => setStockProduct(productList.find((product) => product.trackInventory) ?? null)}
            >
              <PackagePlusIcon data-icon="inline-start" />
              Entrada de estoque
            </Button>
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              Novo item
            </Button>
          </>
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo produto ou serviço</DialogTitle>
            <DialogDescription>
              Cadastre itens vendidos e marque controle de estoque quando precisar acompanhar quantidade e custo médio.
            </DialogDescription>
          </DialogHeader>
          <ProductForm form={form} isPending={isPending} onChange={setForm} onSubmit={submit} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={stockProduct !== null}
        onOpenChange={(open) => {
          if (!open) setStockProduct(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {stockProduct ? `Entrada de estoque: ${stockProduct.name}` : "Entrada de estoque"}
            </DialogTitle>
            <DialogDescription>
              Registre compras pagas por caixa ou banco para atualizar quantidade, custo total e custo médio.
            </DialogDescription>
          </DialogHeader>
          {stockProduct ? (
            <StockIntakeForm
              accounts={paymentAccounts}
              draft={stockIntake}
              isPending={createStockIntake.isPending}
              product={stockProduct}
              onChange={setStockIntake}
              onSubmit={submitStockIntake}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({
  form,
  isPending,
  onChange,
  onSubmit,
}: {
  form: CreateProductDto;
  isPending: boolean;
  onChange: React.Dispatch<React.SetStateAction<CreateProductDto>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <Field>
        <FieldLabel htmlFor="product-name">Nome</FieldLabel>
        <Input
          id="product-name"
          required
          value={form.name}
          placeholder="Consultoria mensal"
          onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel>Tipo</FieldLabel>
          <Select
            value={form.type}
            onValueChange={(value) =>
              onChange((current) => ({
                ...current,
                type: value as CreateProductDto["type"],
                trackInventory: value === "product" ? current.trackInventory : false,
              }))
            }
          >
            <SelectTrigger size="sm" className="w-full" aria-label="Tipo do item">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Serviço</SelectItem>
              <SelectItem value="product">Produto</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Preço padrão</FieldLabel>
          <MoneyInput
            aria-label="Preço padrão"
            value={form.defaultSalePrice}
            onValueChange={(value) => onChange((current) => ({ ...current, defaultSalePrice: value }))}
          />
        </Field>
      </div>

      {form.type === "product" ? (
        <Field orientation="horizontal">
          <Switch
            id="product-track-inventory"
            checked={Boolean(form.trackInventory)}
            onCheckedChange={(checked) =>
              onChange((current) => ({ ...current, trackInventory: checked }))
            }
          />
          <FieldLabel htmlFor="product-track-inventory">Controlar estoque</FieldLabel>
        </Field>
      ) : null}

      <LoadingButton loading={isPending ? { text: "Cadastrando..." } : false}>
        <PlusIcon data-icon="inline-start" />
        Cadastrar item
      </LoadingButton>
    </form>
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
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2 text-sm md:grid-cols-3">
        <StockMetric label="Qtd. atual" value={product.stock?.quantity ?? "0.000"} />
        <StockMetric label="Custo total" value={`R$ ${product.stock?.totalCost ?? "0.00"}`} />
        <StockMetric label="Custo médio" value={`R$ ${product.stock?.averageUnitCost ?? "0.00"}`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="stock-date">Data</FieldLabel>
          <Input
            id="stock-date"
            required
            type="date"
            value={draft.date}
            onChange={(event) => onChange({ ...draft, date: event.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel>Quantidade</FieldLabel>
          <QuantityInput
            aria-label="Quantidade de entrada"
            value={draft.quantity}
            onValueChange={(value) => onChange({ ...draft, quantity: value })}
          />
        </Field>
        <Field>
          <FieldLabel>Custo unitário</FieldLabel>
          <MoneyInput
            aria-label="Custo unitário"
            value={draft.unitCost}
            onValueChange={(value) => onChange({ ...draft, unitCost: value })}
          />
        </Field>
        <Field>
          <FieldLabel>Pagamento</FieldLabel>
          <Select
            value={draft.paymentAccountId}
            onValueChange={(value) => onChange({ ...draft, paymentAccountId: value })}
          >
            <SelectTrigger size="sm" className="w-full" aria-label="Conta de pagamento">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={String(account.id)}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <LoadingButton loading={isPending ? { text: "Atualizando..." } : false}>
        Adicionar estoque
      </LoadingButton>
    </form>
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