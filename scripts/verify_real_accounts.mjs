import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1].trim()] = val;
  }
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Key missing in .env.local");
}

const roles = ["CITIZEN", "GOVERNMENT", "SURVEYOR", "BANK", "ADMIN"];

console.log("==================================================================");
console.log("VERIFYING 5 REAL SUPABASE ACCOUNTS VIA REAL SIGN IN & SIGN OUT");
console.log("Target Project:", supabaseUrl);
console.log("==================================================================\n");

let allPassed = true;

for (const role of roles) {
  const email = env[`DEMO_${role}_EMAIL`];
  const password = env[`DEMO_${role}_PASSWORD`];
  const expectedRole = role.toLowerCase();

  if (!email || !password) {
    console.error(`❌ [${role}] Credentials missing in .env.local`);
    allPassed = false;
    continue;
  }

  // Create clean isolated client
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Sign In
  const { data: authData, error: authErr } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (authErr || !authData.user) {
    console.error(`❌ [${role}] Sign In Failed:`, authErr?.message);
    allPassed = false;
    continue;
  }

  const user = authData.user;
  const isConfirmed = Boolean(user.email_confirmed_at);

  // 2. Query Profile
  const { data: profile, error: profErr } = await client
    .from("profiles")
    .select("id, full_name, email, role, region")
    .eq("id", user.id)
    .single();

  if (profErr || !profile) {
    console.error(`❌ [${role}] Profile query failed:`, profErr?.message);
    allPassed = false;
    continue;
  }

  const roleMatches = profile.role === expectedRole;

  // 3. Sign Out
  const { error: signOutErr } = await client.auth.signOut();
  if (signOutErr) {
    console.error(`❌ [${role}] Sign Out Failed:`, signOutErr?.message);
    allPassed = false;
    continue;
  }

  if (isConfirmed && roleMatches) {
    console.log(
      `✅ [${role}] PASS — Auth User: ${user.id} | Email: ${email} | Confirmed: ${isConfirmed} | Profile Role: ${profile.role} | SignOut: OK`,
    );
  } else {
    console.error(
      `❌ [${role}] Validation Failed: Confirmed=${isConfirmed}, ProfileRole=${profile.role} (expected ${expectedRole})`,
    );
    allPassed = false;
  }
}

console.log("\n==================================================================");
if (allPassed) {
  console.log("🎉 ALL 5 REAL SUPABASE TEST ACCOUNTS VERIFIED SUCCESSFULLY!");
} else {
  console.error("⚠️ SOME ACCOUNTS FAILED VERIFICATION.");
  process.exit(1);
}
console.log("==================================================================");
