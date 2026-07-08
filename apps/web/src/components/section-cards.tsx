import { AccountingHelp } from "@web/components/accounting-help";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import { formatMoney } from "@web/lib/format";
import type { DashboardDto } from "@dto/dashboard.dto";
import { ArrowDownIcon, ArrowUpIcon, HandCoinsIcon, MinusIcon } from "lucide-react";

export function SectionCards({ data }: { data: DashboardDto }) {
  const netResult = Number(data.dre.netResult);
  const isProfit = netResult > 0;
  const isLoss = netResult < 0;
  const periodLabel = formatPeriodLabel(data.dre.period);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Caixa + Bancos
            </CardTitle>
            <AccountingHelp title="Caixa + Bancos">
              Soma dos saldos postados nas contas de caixa e banco. Mostra o dinheiro disponível
              hoje.
            </AccountingHelp>
          </div>
          <HandCoinsIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">R$ {formatMoney(data.cashAndBank)}</div>
          <p className="text-xs text-muted-foreground">Disponível hoje</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas do mês
            </CardTitle>
            <AccountingHelp title="Receitas">
              Valores vendidos ou prestados no período. Entram pelo regime dos lançamentos postados,
              não por estimativa.
            </AccountingHelp>
          </div>
          <ArrowUpIcon className="size-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">R$ {formatMoney(data.dre.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">Resultado de {periodLabel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas do mês
            </CardTitle>
            <AccountingHelp title="Despesas">
              Gastos e custos reconhecidos no período, como despesas operacionais e CMV quando há
              baixa de estoque.
            </AccountingHelp>
          </div>
          <ArrowDownIcon className="size-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">R$ {formatMoney(data.dre.totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">Resultado de {periodLabel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lucro/Prejuízo do mês
            </CardTitle>
            <AccountingHelp title="Lucro ou prejuízo">
              Resultado da DRE do mês: receitas menos despesas. Verde indica lucro; vermelho indica
              prejuízo.
            </AccountingHelp>
          </div>
          {isProfit ? (
            <ArrowUpIcon className="size-4 text-emerald-600" />
          ) : isLoss ? (
            <ArrowDownIcon className="size-4 text-red-600" />
          ) : (
            <MinusIcon className="size-4 text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-semibold ${
              isProfit ? "text-emerald-600" : isLoss ? "text-red-600" : "text-muted-foreground"
            }`}
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
