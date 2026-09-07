import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/government")({
  component: GovernmentLayout,
});

function GovernmentLayout() {
  return <Outlet />;
}
