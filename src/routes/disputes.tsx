import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/disputes")({
  component: DisputesLayout,
});

function DisputesLayout() {
  return <Outlet />;
}
