import { Link } from "@tanstack/react-router";
import { Button } from "@web/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { Separator } from "@web/components/ui/separator";

export default function DashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo recomendado para testar vendas</CardTitle>
        <CardDescription>
          Cadastre serviços ou produtos sem controle de estoque primeiro. Produtos com estoque
          controlado precisam de saldo antes da venda.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1 text-sm">
          <span>1. Cadastre um serviço ou produto.</span>
          <span>2. Crie uma venda à vista ou a prazo.</span>
          <span>3. Confira o lançamento contábil no diário.</span>
        </div>
        <Separator className="md:hidden" />
        <Button asChild>
          <Link to="/dashboard/sales">Criar venda</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
