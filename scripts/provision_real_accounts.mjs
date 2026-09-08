import fs from "fs";
import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

const envContent = fs.readFileSync(
  "/Users/kushal/Documents/projects/TerraTrust AI-2/.env.local",
  "utf8",
);
const serviceRoleKey = envContent
  .split("\n")
  .find((l) => l.startsWith("SUPABASE_SERVICE_ROLE_KEY="))
  .split("=")[1]
  .trim();
const supabaseUrl = "https://iixsxywjsclzbjfzlnvq.supabase.co";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const accountsToConfigure = [
  {
    role: "citizen",
    email: "citizen@terratrust.ai",
    fullName: "Kushal Santhosh",
    region: "Karnataka",
  },
  {
    role: "government",
    email: "government@terratrust.ai",
    fullName: "Dr. Vandana Rao",
    region: "Karnataka",
  },
  {
    role: "surveyor",
    email: "surveyor@terratrust.ai",
    fullName: "Arjun Mehta",
    region: "Karnataka",
  },
  {
    role: "bank",
    email: "bank@terratrust.ai",
    fullName: "Priya Sharma (Senior Underwriter)",
    region: "Karnataka",
  },
  {
    role: "admin",
    email: "admin@terratrust.ai",
    fullName: "System Administrator",
    region: "Karnataka",
  },
];

const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
const existingUsers = listData?.users || [];

const envVars = {};

for (const acc of accountsToConfigure) {
  const existing = existingUsers.find((u) => u.email?.toLowerCase() === acc.email.toLowerCase());
  // Generate secure password without comment characters like '#'
  const randomSuffix = randomBytes(9).toString("base64url").replace(/[-_]/g, "x");
  const password = `TerraTrust!${randomSuffix}2026`;
  let userId;

  if (existing) {
    userId = existing.id;
    const { data: updated, error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: acc.fullName,
        role: acc.role,
        region: acc.region,
        email_verified: true,
      },
    });
    if (updErr) {
      console.error(`Error updating user ${acc.email}:`, updErr.message);
      process.exit(1);
    }
  } else {
    const { data: created, error: crtErr } = await supabaseAdmin.auth.admin.createUser({
      email: acc.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: acc.fullName,
        role: acc.role,
        region: acc.region,
        email_verified: true,
      },
    });
    if (crtErr) {
      console.error(`Error creating user ${acc.email}:`, crtErr.message);
      process.exit(1);
    }
    userId = created.user.id;
  }

  // Upsert profile
  const { error: profErr } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      email: acc.email,
      full_name: acc.fullName,
      role: acc.role,
      region: acc.region,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profErr) {
    console.error(`Error upserting profile for ${acc.email}:`, profErr.message);
    process.exit(1);
  }

  const roleUpper = acc.role.toUpperCase();
  envVars[`DEMO_${roleUpper}_EMAIL`] = acc.email;
  envVars[`DEMO_${roleUpper}_PASSWORD`] = password;

  console.log(`Account verified & ready: [${acc.role}] ${acc.email} (userId: ${userId})`);
}

// Update .env.local without exposing passwords in logs
const envLocalPath = ".env.local";
let envLocal = fs.readFileSync(envLocalPath, "utf8");

// Remove any existing demo variables before writing the server-only values.
const cleanLines = envLocal.split("\n").filter((line) => !line.startsWith("DEMO_"));
let newEnvLocal =
  cleanLines.join("\n").trim() + "\n\n# Real Supabase QA Test Account Credentials\n";
for (const [k, v] of Object.entries(envVars)) {
  newEnvLocal += `${k}="${v}"\n`;
}

fs.writeFileSync(envLocalPath, newEnvLocal, "utf8");
console.log("Successfully wrote all 5 QA credentials into .env.local!");
