import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/attestations")({
  beforeLoad: () => {
    throw redirect({ to: "/verification" });
  },
  component: () => null,
});
