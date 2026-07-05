import { Separator } from "@web/components/ui/separator";
import { SidebarTrigger } from "@web/components/ui/sidebar";

export function SiteHeader({ title }: { title: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-base font-semibold">{title}</h1>
    </header>
  );
}
