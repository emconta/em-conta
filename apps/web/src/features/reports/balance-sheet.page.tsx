import { AccountingHelp } from "@web/components/accounting-help";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { Field, FieldLabel } from "@web/components/ui/field";
import { Input } from "@web/components/ui/input";
import { Button } from "@web/components/ui/button";
import { useBalanceSheet } from "@web/features/reports/reports.queries";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
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

export default function BalanceSheetPage() {
  const { dateFrom: defaultFrom, dateTo: defaultTo } = getCurrentMonthRange();
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [submittedRange, setSubmittedRange] = useState({
    dateFrom: defaultFrom,
    dateTo: defaultTo,
  });
  const report = useBalanceSheet(submittedRange.dateFrom, submittedRange.dateTo);
  const data = report.data?.isOk() ? report.data.value : null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedRange({ dateFrom, dateTo });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Balanço Patrimonial</p>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">BP</h1>
          <AccountingHelp title="Balanço Patrimonial">
            Foto da posição da empresa: bens e direitos devem fechar com obrigações e patrimônio.
          </AccountingHelp>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Período</CardTitle>
          <CardDescription>Selecione o intervalo para calcular o BP.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={submit}>
            <Field>
              <FieldLabel htmlFor="bp-from">De</FieldLabel>
              <Input
                id="bp-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="bp-to">Até</FieldLabel>
              <Input
                id="bp-to"
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
        <p className="text-sm text-muted-foreground">Carregando BP...</p>
      ) : report.isError ? (
        <p className="text-sm text-red-600">
          Não foi possível carregar o BP. Verifique o período e tente novamente.
        </p>
      ) : data ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <BalanceSheetGroupCard group={data.assets} />
            <BalanceSheetGroupCard group={data.liabilities} />
            <BalanceSheetGroupCard group={data.equity} />
            <Card
              className={
                data.isBalanced
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-red-200 bg-red-50/50"
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {data.isBalanced ? (
                    <CheckCircle2Icon className="size-5 text-emerald-600" />
                  ) : (
                    <XCircleIcon className="size-5 text-red-600" />
                  )}
                  Passivo + Patrimônio Líquido
                  <AccountingHelp title="Equação do balanço">
                    O balanço está correto quando Ativo é igual a Passivo mais Patrimônio Líquido.
                  </AccountingHelp>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  R$ {formatMoney(data.totalLiabilitiesAndEquity)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BalanceSheetGroupCard({
  group,
}: {
  group: {
    items: {
      accountId: number | null;
      accountName: string;
      accountKey: string | null;
      amount: string;
    }[];
    label: string;
    total: string;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{group.label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {group.items.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {group.items.map((item) => (
              <li
                key={item.accountId ?? item.accountName}
                className="flex justify-between border-b py-2 text-sm"
              >
                <span>{item.accountName}</span>
                <span className="tabular-nums">R$ {formatMoney(item.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma conta com saldo.</p>
        )}
        <div className="flex justify-between border-t pt-3 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">R$ {formatMoney(group.total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
