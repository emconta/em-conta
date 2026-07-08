import { AccountingHelp } from "@web/components/accounting-help";
import { Button } from "@web/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { Field, FieldLabel } from "@web/components/ui/field";
import { Input } from "@web/components/ui/input";
import { useDreReport } from "@web/features/reports/reports.queries";
import { Fragment, useState } from "react";

function formatMoney(value: string) {
  const numeric = Number(value);

  return numeric.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatSignedMoney(value: string) {
  const numeric = Number(value);
  const absolute = formatMoney(String(Math.abs(numeric)));

  return numeric < 0 ? `-R$ ${absolute}` : `R$ ${absolute}`;
}

function formatPercent(value: string | null) {
  if (value === null) return "N/A";

  return `${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
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
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">DRE</h1>
          <AccountingHelp title="DRE">
            Mostra se a empresa teve lucro ou prejuízo no período: receitas menos custos e despesas.
          </AccountingHelp>
        </div>
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
              <div className="flex items-center gap-1">
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Resultado
                </CardTitle>
                <AccountingHelp title="Resultado da DRE">
                  Valor final do período. Positivo indica lucro; negativo indica prejuízo.
                </AccountingHelp>
              </div>
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

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">DRE detalhada</CardTitle>
              <CardDescription>
                Valores por seção e por conta, com percentual sobre a receita bruta quando houver
                receita no período.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th scope="col" className="py-2 pr-4 font-medium">
                        Linha
                      </th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">
                        Valor
                      </th>
                      <th scope="col" className="py-2 pl-4 text-right font-medium">
                        % da receita
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sections.map((section) => (
                      <Fragment key={section.key}>
                        <tr key={section.key} className="border-b bg-muted/40 font-medium">
                          <th scope="row" className="py-2 pr-4 text-left">
                            {section.label}
                          </th>
                          <td className="px-4 py-2 text-right tabular-nums">
                            {formatSignedMoney(section.total)}
                          </td>
                          <td className="py-2 pl-4 text-right tabular-nums">
                            {formatPercent(section.percentOfRevenue)}
                          </td>
                        </tr>
                        {section.items.length > 0 ? (
                          section.items.map((item) => (
                            <tr key={`${section.key}-${item.accountId}`} className="border-b">
                              <td className="py-2 pr-4 pl-4 text-muted-foreground">
                                {item.accountName}
                              </td>
                              <td className="px-4 py-2 text-right tabular-nums">
                                {formatSignedMoney(item.amount)}
                              </td>
                              <td className="py-2 pl-4 text-right tabular-nums text-muted-foreground">
                                {formatPercent(item.percentOfRevenue)}
                              </td>
                            </tr>
                          ))
                        ) : section.key !== "net_result" ? (
                          <tr key={`${section.key}-empty`} className="border-b">
                            <td className="py-2 pr-4 pl-4 text-muted-foreground" colSpan={3}>
                              Nenhuma conta com movimento nesta seção.
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
