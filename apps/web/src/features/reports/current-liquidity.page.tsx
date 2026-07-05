import { Button } from "@web/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { Field, FieldLabel } from "@web/components/ui/field";
import { Input } from "@web/components/ui/input";
import { useCurrentLiquidity } from "@web/features/reports/reports.queries";
import { useState } from "react";

function formatMoney(value: string) {
  const numeric = Number(value);

  return numeric.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function CurrentLiquidityPage() {
  const defaultDate = getToday();
  const [dateTo, setDateTo] = useState(defaultDate);
  const [submittedDate, setSubmittedDate] = useState(defaultDate);
  const report = useCurrentLiquidity(submittedDate);
  const data = report.data?.isOk() ? report.data.value : null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedDate(dateTo);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Índice de liquidez</p>
        <h1 className="text-2xl font-semibold tracking-tight">Liquidez corrente</h1>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Data de corte</CardTitle>
          <CardDescription>
            Selecione a data para calcular o ativo circulante e o passivo circulante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={submit}>
            <Field>
              <FieldLabel htmlFor="liquidity-to">Até</FieldLabel>
              <Input
                id="liquidity-to"
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
        <p className="text-sm text-muted-foreground">Carregando liquidez corrente...</p>
      ) : report.isError ? (
        <p className="text-sm text-red-600">
          Não foi possível carregar a liquidez corrente. Verifique a data e tente novamente.
        </p>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground">
                Ativo circulante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">R$ {formatMoney(data.currentAssets)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground">
                Passivo circulante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">R$ {formatMoney(data.currentLiabilities)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground">
                Liquidez corrente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{data.display}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
