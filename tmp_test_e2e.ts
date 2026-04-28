import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carrega as vars do Nuxt
dotenv.config({ path: 'c:/Antigravity/+BET/.env' })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SECRET_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function runTest() {
  console.log('1. Buscando Scoring Systems...')
  const { data: scorings } = await supabase.from('scoring_systems').select('*')
  console.log('Scorings:', scorings?.map(s => s.nome))
  
  const equilibrado = scorings?.find(s => s.nome === 'Equilibrado')
  
  console.log('\n2. Criando campeonato de teste E2E (Champions League 2024)...')
  const { data: camp, error: errCamp } = await supabase
    .from('campeonatos')
    .insert({
      nome: 'Champions League 2024',
      api_competition_code: 'CL',
      season: 2024,
      status: 'rascunho',
      scoring_system_id: equilibrado?.id,
      max_rodadas: 8
    })
    .select()
    .single()
    
  if (errCamp) {
    if (errCamp.code === '23505') { // already exists
        console.log('O campeonato já existe. Buscando ele...')
        const { data: existing } = await supabase.from('campeonatos').select('*').eq('api_competition_code', 'CL').single()
        console.log('Pronto:', existing)
        return startCamp(existing.id)
    }
    console.error('Erro ao criar campeonato:', errCamp)
    return
  }
  
  console.log('Campeonato criado:', camp)
  await startCamp(camp.id)
}

async function startCamp(championshipId: string) {
  console.log('\n3. Iniciando campeonato e importando rodadas API (isso baterá no /api/admin/start-championship virtualmente)')
  
  // Como é local e temos auth, vamos fazer um request no localhost:3000
  // mas o endpoint de dev precisa do cookie auth de admin.
  // Em vez disso, vou simular o que o endpoint faz diretamente ou mandar um POST com fetch + Auth header 
  // (Precisaríamos logar. Vamos usar o Supabase admin pra gerar um JWT, ou simplesmente invocar via `fetch` se eu usar a key no backend?
  // O +BET checa o requireAdmin lendo o event context.
  
  // Vamos apagar a constraint de is_admin para esse teste e chamar localmente? Não, mais fácil usar o JWT do user dono do BD admin.
  const { data: authAdmin } = await supabase.from('usuarios').select('id, email').eq('is_admin', true).limit(1).single()
  console.log('Admin detectado:', authAdmin?.email)
  
  console.log('\n=======================================')
  console.log('Para testar a importação de rodadas, vá ao navegador em: http://localhost:3000/admin/campeonatos')
  console.log('E clique em INICIAR no card da Champions League 2024!')
  console.log('=======================================')
}

runTest()
