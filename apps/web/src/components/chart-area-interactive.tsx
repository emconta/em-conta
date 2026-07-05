import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@web/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@web/components/ui/chart";
import { useMonthlyRevenueExpenses } from "@web/features/dashboard/dashboard.queries";

function formatMonthBr(yyyymm: string) {
  const [year, month] = yyyymm.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("pt-BR", { month: "short" });
}

function parseMoney(value: string) {
  const num = Number(value);

  return Number.isFinite(num) ? num : 0;
}

const chartConfig = {
  revenue: {
    label: "Receitas",
    theme: { light: "var(--chart-1)", dark: "var(--chart-1)" },
  },
  expenses: {
    label: "Despesas",
    theme: { light: "var(--chart-2)", dark: "var(--chart-2)" },
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const [range, setRange] = React.useState<"6m" | "12m">("12m");
  const months = range === "6m" ? 6 : 12;
  const { data, isLoading, isError } = useMonthlyRevenueExpenses(months);

  const chartData = React.useMemo(() => {
    if (!data?.isOk()) return [];

    return data.value.map((item) => ({
      month: formatMonthBr(item.month),
      revenue: parseMoney(item.revenue),
      expenses: parseMoney(item.expenses),
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 pb-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Receitas vs despesas</CardTitle>
          <CardDescription>Histórico mensal para acompanhar a evolução.</CardDescription>
        </div>
        <Tabs value={range} onValueChange={(value) => setRange(value as "6m" | "12m")}>
          <TabsList>
            <TabsTrigger value="6m">Últimos 6 meses</TabsTrigger>
            <TabsTrigger value="12m">Último ano</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex aspect-video w-full items-center justify-center text-sm text-muted-foreground">
            Carregando gráfico...
          </div>
        ) : isError || chartData.length === 0 ? (
          <div className="flex aspect-video w-full items-center justify-center text-sm text-muted-foreground">
            Sem dados para exibir.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-video w-full">
            <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: number) =>
                  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                }
                tick={{ fill: "var(--muted-foreground)" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                fill="url(#fillRevenue)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="var(--color-expenses)"
                fill="url(#fillExpenses)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
