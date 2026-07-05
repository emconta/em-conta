import { Link } from "@tanstack/react-router";
import { ChartAreaInteractive } from "@web/components/chart-area-interactive";
import { SectionCards } from "@web/components/section-cards";
import { Button } from "@web/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { DataTable, type ColumnDef } from "@web/components/ui/data-table";
import { Skeleton } from "@web/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@web/components/ui/tabs";
import { useDashboardSummary } from "@web/features/dashboard/dashboard.queries";
import { useJournalEntries } from "@web/features/journal/journal.queries";
import { useSales } from "@web/features/sales/sales.queries";
import { formatMoney } from "@web/lib/format";
import type { JournalEntryListItemDto, JournalSourceTypeDto } from "@dto/journal.dto";
import type { SaleListItemDto } from "@dto/sales.dto";
import { ArrowRightIcon } from "lucide-react";
import * as React from "react";

const sourceTypeLabel: Record<JournalSourceTypeDto, string> = {
  sale: "Venda",
  receipt: "Recebimento",
  stock_issue: "Saída de estoque",
  purchase: "Compra",
  manual: "Manual",
  reversal: "Estorno",
};

const recentEntriesColumns: ColumnDef<JournalEntryListItemDto>[] = [
  {
    accessorFn: (row) => new Date(row.entryDate).toLocaleDateString("pt-BR"),
    header: "Data",
  },
  {
    accessorKey: "memo",
    header: "Memorando",
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
  {
    accessorKey: "totalDebits",
    header: "Débito",
    cell: ({ getValue }) => `R$ ${formatMoney(String(getValue()))}`,
  },
  {
    accessorKey: "totalCredits",
    header: "Crédito",
    cell: ({ getValue }) => `R$ ${formatMoney(String(getValue()))}`,
  },
  {
    accessorFn: (row) => sourceTypeLabel[row.sourceType],
    header: "Origem",
  },
];

const recentSalesColumns: ColumnDef<SaleListItemDto>[] = [
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
];

export default function DashboardPage() {
  const summary = useDashboardSummary();
  const journal = useJournalEntries();
  const sales = useSales();

  const summaryData = summary.data?.isOk() ? summary.data.value : null;
  const journalData = React.useMemo(() => {
    if (!journal.data?.isOk()) return [];

    return [...journal.data.value].sort(
      (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime(),
    );
  }, [journal.data]);
  const salesData = React.useMemo(() => {
    if (!sales.data?.isOk()) return [];

    return [...sales.data.value].sort(
      (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(),
    );
  }, [sales.data]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {summary.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {["cash", "revenue", "expenses", "liquidity"].map((key) => (
            <Skeleton key={key} className="h-28 w-full" />
          ))}
        </div>
      ) : summary.isError || !summaryData ? (
        <p className="text-sm text-red-600">
          Não foi possível carregar o resumo. Tente recarregar a página.
        </p>
      ) : (
        <SectionCards data={summaryData} />
      )}

      <ChartAreaInteractive />

      <Card>
        <Tabs defaultValue="entries">
          <CardHeader className="flex flex-col gap-4 pb-4">
            <div className="flex flex-col gap-1">
              <CardTitle>Movimentações recentes</CardTitle>
              <CardDescription>Últimos lançamentos contábeis do período.</CardDescription>
            </div>
            <TabsList>
              <TabsTrigger value="entries">Lançamentos recentes</TabsTrigger>
              <TabsTrigger value="sales">Vendas recentes</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="entries" className="mt-0">
              <DataTable
                columns={recentEntriesColumns}
                data={journalData}
                isLoading={journal.isLoading}
                emptyMessage="Nenhum lançamento encontrado."
                searchPlaceholder="Buscar lançamento..."
                actions={
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/journal">
                      Ver todos
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                }
              />
            </TabsContent>
            <TabsContent value="sales" className="mt-0">
              <DataTable
                columns={recentSalesColumns}
                data={salesData}
                isLoading={sales.isLoading}
                emptyMessage="Nenhuma venda encontrada."
                searchPlaceholder="Buscar por cliente, data ou status..."
                actions={
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/sales">
                      Ver todas
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                }
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
