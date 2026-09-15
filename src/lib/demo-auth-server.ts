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

    let url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim();
    let publishableKey = (
      process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    )?.trim();
    let email = process.env[`DEMO_${data.role.toUpperCase()}_EMAIL`]?.trim();
    let password = process.env[`DEMO_${data.role.toUpperCase()}_PASSWORD`];

    // Fallback: in local dev, Nitro/Vite might not inject non-VITE variables into process.env
    if (!url || !publishableKey || !email || !password) {
      try {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const envPath = path.resolve(process.cwd(), ".env.local");
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, "utf8");
          const map: Record<string, string> = {};
          for (const line of content.split("\n")) {
            const m = line.match(/^([^=]+)=(.*)$/);
            if (m) {
              let v = m[2].trim();
              if (
                (v.startsWith('"') && v.endsWith('"')) ||
                (v.startsWith("'") && v.endsWith("'"))
              ) {
                v = v.slice(1, -1);
              }
              map[m[1].trim()] = v;
            }
          }
          if (!url) url = (map.SUPABASE_URL || map.VITE_SUPABASE_URL)?.trim();
          if (!publishableKey)
            publishableKey = (
              map.SUPABASE_PUBLISHABLE_KEY || map.VITE_SUPABASE_PUBLISHABLE_KEY
            )?.trim();
          if (!email) email = map[`DEMO_${data.role.toUpperCase()}_EMAIL`]?.trim();
          if (!password) password = map[`DEMO_${data.role.toUpperCase()}_PASSWORD`];
        }
      } catch {
        // Continue with whatever variables exist
      }
    }

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
