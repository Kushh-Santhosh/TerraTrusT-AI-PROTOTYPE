import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/surveyor")({
  component: SurveyorLayout,
});

function SurveyorLayout() {
  return <Outlet />;
}
