import { Button } from "@web/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@web/components/ui/hover-card";
import { CircleHelpIcon } from "lucide-react";
import type { ReactNode } from "react";

export function AccountingHelp({
  children,
  label,
  title,
}: {
  children: ReactNode;
  label?: string;
  title: string;
}) {
  return (
    <HoverCard openDelay={120} closeDelay={120}>
      <HoverCardTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label ?? `Ajuda: ${title}`}
        >
          <CircleHelpIcon />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-72">
        <div className="flex flex-col gap-1.5">
          <h4 className="font-medium">{title}</h4>
          <p className="text-muted-foreground">{children}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
