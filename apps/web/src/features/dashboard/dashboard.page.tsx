import { useRouteContext } from "@tanstack/react-router";

export default function DashboardPage() {
  const { me } = useRouteContext({ from: "/dashboard" });

  return (
    <main className="w-screen h-screen flex items-center justify-center">
      <pre>
        <code>{JSON.stringify(me, null, 2)}</code>
      </pre>
    </main>
  );
}
