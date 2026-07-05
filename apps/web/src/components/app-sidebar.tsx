import { Link } from "@tanstack/react-router";
import { NavDocuments } from "@web/components/nav-documents";
import { NavMain } from "@web/components/nav-main";
import { NavUser } from "@web/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@web/components/ui/sidebar";
import {
  BarChart3Icon,
  BoxesIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  NotebookPenIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  ScaleIcon,
  SheetIcon,
  TrendingUpIcon,
} from "lucide-react";

type User = {
  email?: string;
  image?: string;
  name?: string;
};

const mainNav = [
  { icon: LayoutDashboardIcon, label: "Resumo", url: "/dashboard" },
  { icon: NotebookPenIcon, label: "Lançamentos", url: "/dashboard/journal" },
  { icon: ScaleIcon, label: "Razão", url: "/dashboard/ledger" },
  { icon: BoxesIcon, label: "Produtos", url: "/dashboard/products" },
  { icon: ReceiptTextIcon, label: "Vendas", url: "/dashboard/sales" },
];

const reportsNav = [
  { icon: BarChart3Icon, label: "DRE", url: "/dashboard/reports/dre" },
  { icon: SheetIcon, label: "Balanço Patrimonial", url: "/dashboard/reports/balance-sheet" },
  { icon: LandmarkIcon, label: "Liquidez Corrente", url: "/dashboard/reports/current-liquidity" },
];

export function AppSidebar({ user }: { user: User }) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard" className="flex items-center">
                <PiggyBankIcon className="!size-7 shrink-0 text-primary" />
                <span className="truncate font-semibold text-primary text-lg">emConta</span>

                {/* <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">emConta</span>
                  <span className="truncate text-xs">Contabilidade MEI</span>
                </div> */}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNav} />
        <NavDocuments items={reportsNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
