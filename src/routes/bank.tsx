import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/bank")({
  component: BankLayout,
});

function BankLayout() {
  return <ProtectedRoute allowedRoles={["bank", "admin"]} />;
}
