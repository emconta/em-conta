import { Button } from "@web/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { Field, FieldLabel } from "@web/components/ui/field";
import { Input } from "@web/components/ui/input";
import { useDreReport } from "@web/features/reports/reports.queries";
import { useState } from "react";

function formatMoney(value: string) {
  const numeric = Number(value);

  return numeric.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return {
    dateFrom: `${year}-${month}-01`,
    dateTo: `${year}-${month}-${getLastDayOfMonth(year, now.getMonth() + 1)}`,
  };
}

function getLastDayOfMonth(year: number, month: number) {
  return String(new Date(year, month, 0).getDate()).padStart(2, "0");
}

export default function DrePage() {
  const { dateFrom: defaultFrom, dateTo: defaultTo } = getCurrentMonthRange();
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [submittedRange, setSubmittedRange] = useState({
    dateFrom: defaultFrom,
    dateTo: defaultTo,
  });
  const report = useDreReport(submittedRange.dateFrom, submittedRange.dateTo);
  const data = report.data?.isOk() ? report.data.value : null;
  const netResultNumber = data ? Number(data.netResult) : 0;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedRange({ dateFrom, dateTo });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Demonstração de Resultado</p>
        <h1 className="text-2xl font-semibold tracking-tight">DRE</h1>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Período</CardTitle>
          <CardDescription>Selecione o intervalo para calcular a DRE.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={submit}>
            <Field>
              <FieldLabel htmlFor="dre-from">De</FieldLabel>
              <Input
                id="dre-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="dre-to">Até</FieldLabel>
              <Input
                id="dre-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </Field>
            <Button type="submit">Atualizar</Button>
          </form>
        </CardContent>
      </Card>

      {report.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando DRE...</p>
      ) : report.isError ? (
        <p className="text-sm text-red-600">
          Não foi possível carregar a DRE. Verifique o período e tente novamente.
        </p>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground">
                Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">R$ {formatMoney(data.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground">
                Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">R$ {formatMoney(data.totalExpenses)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground">
                Resultado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-semibold ${
                  netResultNumber >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {netResultNumber >= 0 ? "R$ " : "-R$ "}
                {formatMoney(String(Math.abs(netResultNumber)))}
              </p>
            </CardContent>
          </Card>

          {data.revenueBreakdown.length > 0 ? (
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Receitas por conta</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {data.revenueBreakdown.map((item) => (
                    <li key={item.accountId} className="flex justify-between border-b py-2 text-sm">
                      <span>{item.accountName}</span>
                      <span className="tabular-nums">R$ {formatMoney(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {data.expenseBreakdown.length > 0 ? (
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Despesas por conta</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {data.expenseBreakdown.map((item) => (
                    <li key={item.accountId} className="flex justify-between border-b py-2 text-sm">
                      <span>{item.accountName}</span>
                      <span className="tabular-nums">R$ {formatMoney(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
