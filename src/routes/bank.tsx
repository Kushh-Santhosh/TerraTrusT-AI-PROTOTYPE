import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/bank")({
  component: BankLayout,
});

function BankLayout() {
  return <Outlet />;
}
