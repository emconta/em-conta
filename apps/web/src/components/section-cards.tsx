import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import { formatMoney } from "@web/lib/format";
import type { DashboardDto } from "@dto/dashboard.dto";
import { ArrowDownIcon, ArrowUpIcon, HandCoinsIcon } from "lucide-react";

export function SectionCards({ data }: { data: DashboardDto }) {
  const netResult = Number(data.dre.netResult);
  const isProfit = netResult >= 0;
  const periodLabel = formatPeriodLabel(data.dre.period);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Caixa + Bancos
          </CardTitle>
          <HandCoinsIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">R$ {formatMoney(data.cashAndBank)}</div>
          <p className="text-xs text-muted-foreground">Disponível hoje</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Receitas do mês
          </CardTitle>
          <ArrowUpIcon className="size-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">R$ {formatMoney(data.dre.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">Resultado de {periodLabel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Despesas do mês
          </CardTitle>
          <ArrowDownIcon className="size-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">R$ {formatMoney(data.dre.totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">Resultado de {periodLabel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Lucro/Prejuízo do mês
          </CardTitle>
          {isProfit ? (
            <ArrowUpIcon className="size-4 text-emerald-600" />
          ) : (
            <ArrowDownIcon className="size-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-semibold ${isProfit ? "text-emerald-600" : "text-red-600"}`}
          >
            R$ {formatMoney(data.dre.netResult)}
          </div>
          <p className="text-xs text-muted-foreground">Resultado de {periodLabel}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function formatPeriodLabel(period: DashboardDto["dre"]["period"]) {
  const from = new Date(`${period.dateFrom}T00:00:00Z`);

  return from.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
