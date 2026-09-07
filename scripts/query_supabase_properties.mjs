import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter(Boolean).map((line) => {
  const index = line.indexOf('=');
  return [line.slice(0, index), line.slice(index + 1)];
}));
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseProps() {
  const { data, error } = await supabase
    .from('properties')
    .select('id, passport_id, property_name, status, trust_score, location, area')
    .limit(10);

  if (error) {
    console.error('Supabase error:', error);
    return;
  }

  console.log(`Found ${data.length} properties in Supabase:`);
  for (const p of data) {
    console.log(`- ID: ${p.id} | Passport: ${p.passport_id} | Name: ${p.property_name} | Status: ${p.status} | Lat/Lng: ${p.location?.latitude}, ${p.location?.longitude} | Boundary pts: ${p.location?.boundary?.length || 0}`);
  }
}

checkSupabaseProps().catch(console.error);
