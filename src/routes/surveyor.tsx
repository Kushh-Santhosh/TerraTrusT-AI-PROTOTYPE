import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/surveyor")({
  component: SurveyorLayout,
});

function SurveyorLayout() {
  return <ProtectedRoute allowedRoles={["surveyor", "admin"]} />;
}
