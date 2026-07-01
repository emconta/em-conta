import type { QueryClient } from "@tanstack/react-query";
import { createRootRoute, createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { Toaster } from "@web/components/ui/sonner";

export type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster position="bottom-center" richColors />
    </>
  );
}
