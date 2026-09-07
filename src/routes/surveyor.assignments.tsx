import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/surveyor/assignments")({
  component: SurveyorAssignmentsLayout,
});

function SurveyorAssignmentsLayout() {
  return <Outlet />;
}
