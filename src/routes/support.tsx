import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/support")({
  component: SupportLayout,
});

function SupportLayout() {
  return <Outlet />;
}
