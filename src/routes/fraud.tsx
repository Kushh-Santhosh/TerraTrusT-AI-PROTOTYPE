import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/fraud")({
  component: FraudLayout,
});

function FraudLayout() {
  return <Outlet />;
}
