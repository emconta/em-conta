import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"
import { DismissableLayer } from "radix-ui/internal"

import {
  setFloatingLayerOpen,
  useFloatingLayerDismissGuard,
} from "@web/components/ui/floating-layer-dismiss"
import { cn } from "@web/lib/utils"

function HoverCard({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  const id = React.useMemo(() => Symbol("hover-card"), [])
  useFloatingLayerDismissGuard()

  React.useEffect(
    () => () => {
      setFloatingLayerOpen(id, false)
    },
    [id],
  )

  return (
    <HoverCardPrimitive.Root
      data-slot="hover-card"
      onOpenChange={(open) => {
        setFloatingLayerOpen(id, open)
        onOpenChange?.(open)
      }}
      {...props}
    />
  )
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

function HoverCardContent({
  className,
  align = "center",
  collisionPadding = 16,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <DismissableLayer.Branch asChild>
        <HoverCardPrimitive.Content
          data-slot="hover-card-content"
          align={align}
          collisionPadding={collisionPadding}
          sideOffset={sideOffset}
          className={cn(
            "z-50 w-64 max-w-[calc(100vw-2rem)] origin-(--radix-hover-card-content-transform-origin) rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </DismissableLayer.Branch>
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
