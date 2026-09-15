import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/government")({
  component: GovernmentLayout,
});

function GovernmentLayout() {
  return <ProtectedRoute allowedRoles={["government", "admin"]} />;
}
