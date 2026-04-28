import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function check() {
  const { data, error } = await supabaseAdmin.rpc('run_sql', { query: `SELECT pg_get_viewdef('vw_ranking', true) as def;` });
  
  if (error || !data) {
     console.error("RPC falhou, vou tentar ler via REST", error);
     // Fallback to reading the raw response through supabase definitions if possible.
     // If not, we might not get the view def.
  } else {
     console.log("View Definition:", data[0].def);
  }
}

check();
