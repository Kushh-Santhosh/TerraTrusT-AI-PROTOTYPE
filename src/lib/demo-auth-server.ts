import { createServerFn } from "@tanstack/react-start";

import type { Role } from "./auth";

const roles: Role[] = ["citizen", "government", "surveyor", "bank", "admin"];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

export const signInDemoAccount = createServerFn({ method: "POST" })
  .validator((input: { role: Role }) => input)
  .handler(async ({ data }) => {
    if (!isRole(data.role)) {
      return { error: "Unknown demo role." as const, session: null };
    }

    const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim();
    const publishableKey = (
      process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    )?.trim();
    const email = process.env[`DEMO_${data.role.toUpperCase()}_EMAIL`]?.trim();
    const password = process.env[`DEMO_${data.role.toUpperCase()}_PASSWORD`];

    if (!url || !publishableKey || !email || !password) {
      return {
        error: "This demo account is not configured on the server." as const,
        session: null,
      };
    }

    try {
      const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: publishableKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        return {
          error: "The Supabase demo account could not be authenticated." as const,
          session: null,
        };
      }

      const session = (await response.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        expires_at?: number;
        token_type: string;
        user: unknown;
      };
      if (!session.access_token || !session.refresh_token || !session.user) {
        return { error: "Supabase returned an incomplete demo session." as const, session: null };
      }

      return {
        error: null,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          expires_at: session.expires_at,
          token_type: session.token_type,
          user: session.user,
        },
      };
    } catch {
      return { error: "The Supabase demo account could not be reached." as const, session: null };
    }
  });
