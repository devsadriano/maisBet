import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function check() {
  const { data: usuarios, error: uErr } = await supabaseAdmin
    .from('usuarios')
    .select('*');
  
  if (uErr) {
    console.error(uErr);
  } else {
    console.log("Usuarios:", JSON.stringify(usuarios, null, 2));
  }

  const { data: camps, error: cErr } = await supabaseAdmin
    .from('campeonatos')
    .select('*');

  if (cErr) {
    console.error(cErr);
  } else {
    console.log("Campeonatos:", JSON.stringify(camps, null, 2));
  }

  const { data: acessos, error: aErr } = await supabaseAdmin
    .from('campeonato_acessos')
    .select('*, times(*)');

  if (aErr) {
    console.error(aErr);
  } else {
    console.log("Acessos:", JSON.stringify(acessos, null, 2));
  }
}

check();
