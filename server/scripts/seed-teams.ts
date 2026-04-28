import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Carrega as variáveis do .env

// Configurações do Supabase e API
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const footballDataKey = process.env.FOOTBALL_DATA_KEY;

if (!supabaseUrl || !supabaseKey || !footballDataKey) {
  console.error("❌ Faltam variáveis de ambiente no .env!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dicionário atualizado para limpar os nomes dos times em 2026
const dicionarioTimes: Record<string, string> = {
  'São Paulo FC': 'São Paulo',
  'Clube Atlético Mineiro': 'Atlético-MG',
  'Clube Athletico Paranaense': 'Athletico-PR',
  'CR Vasco da Gama': 'Vasco',
  'CR Flamengo': 'Flamengo',
  'Fluminense FC': 'Fluminense',
  'Botafogo FR': 'Botafogo',
  'SC Corinthians Paulista': 'Corinthians',
  'SE Palmeiras': 'Palmeiras',
  'Santos FC': 'Santos',
  'Grêmio FBPA': 'Grêmio',
  'SC Internacional': 'Internacional',
  'Cruzeiro EC': 'Cruzeiro',
  'EC Bahia': 'Bahia',
  'EC Vitória': 'Vitória',
  'Red Bull Bragantino': 'RB Bragantino',
  'Mirassol FC': 'Mirassol',
  'Coritiba FBC': 'Coritiba',
  'Associação Chapecoense de Futebol': 'Chapecoense', // Ajuste caso a API retorne diferente
  'Clube do Remo': 'Remo' // Ajuste caso a API retorne diferente
};

async function seedTeams() {
  console.log("⏳ Buscando times do Brasileirão na Football-Data.org...");

  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/BSA/teams', {
      method: 'GET',
      headers: {
        'X-Auth-Token': footballDataKey as string,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const timesApi = data.teams;

    console.log(`✅ ${timesApi.length} times encontrados na API. Preparando inserção...`);

    // Mapeia os dados para o formato da nossa tabela public.times
    const timesParaInserir = timesApi.map((time: any) => {
      // Usa o dicionário para limpar o nome, ou usa o shortName/name como fallback
      const nomeLimpo = dicionarioTimes[time.name] || time.shortName || time.name;

      return {
        api_team_id: time.id,
        nome: nomeLimpo,
      };
    });

    // Faz o Upsert no Supabase
    const { error } = await supabase
      .from('times')
      .upsert(timesParaInserir, { onConflict: 'api_team_id' });

    if (error) {
      throw error;
    }

    console.log("🚀 Sucesso! Todos os times foram sincronizados no seu banco de dados.");
  } catch (error) {
    console.error("❌ Erro ao sincronizar times:", error);
  }
}

seedTeams();