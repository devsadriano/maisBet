const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function main() {
   const { data, error } = await supabase
       .from('campeonato_acessos')
       .select('id, campeonato_id, time_id, email, times(id, nome, escudo_url)');
   
   console.log('Query result:');
   if (error) {
       console.error(error);
   } else {
       console.log(JSON.stringify(data, null, 2));
   }
}

main();
