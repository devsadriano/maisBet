# +BET — Plano de Arquitetura e Execução (v2 — Definitivo)

Aplicação web fullstack de **bolão de futebol do Campeonato Brasileiro** entre amigos. Stack: **Nuxt 4 + Tailwind CSS + @nuxtjs/supabase + API-Sports (RapidAPI)**.

---

## Decisões Arquiteturais Confirmadas

| Ponto | Decisão |
|-------|---------|
| API externa | **API-Sports via RapidAPI** (100 req/dia no free tier) |
| Cache de dados | Frontend lê **somente do Supabase**; sync com API-Sports é feito via rotas server |
| Times | Tabela **`public.times`** com `api_team_id` (inteiro da API-Sports) |
| Usuários | Tabela **`public.usuarios`** com FK para `times`; sem cadastro público |
| Organizador | Rodízio por **nome** em ordem alfabética; loop usando `numero_rodada % total_usuarios` |
| Admin | Configurado **manualmente** no banco (sem tela de cadastro) |
| Auth | Exclusivo por **Magic Link** (sem senha) |

---

## Estrutura de Pastas

```
+BET/
├─ app/
│  ├─ assets/css/main.css
│  ├─ components/
│  │  ├─ RankingTable.vue
│  │  ├─ BetCard.vue
│  │  ├─ MatchCard.vue
│  │  ├─ CountdownTimer.vue
│  │  ├─ AuditGrid.vue
│  │  └─ OrganizerPicker.vue
│  ├─ composables/
│  │  ├─ useAuth.ts
│  │  ├─ useRound.ts
│  │  ├─ useBets.ts
│  │  ├─ useRanking.ts
│  │  ├─ useOrganizer.ts
│  │  └─ useCountdown.ts
│  ├─ layouts/
│  │  ├─ DefaultLayout.vue
│  │  └─ AdminLayout.vue
│  ├─ middleware/
│  │  ├─ authGuard.ts
│  │  └─ isAdmin.ts
│  ├─ pages/
│  │  ├─ index.vue           # Home (redirect para /ranking)
│  │  ├─ login.vue           # Auth com senha + registro por convite
│  │  ├─ confirm.vue         # Callback PKCE (Magic Link)
│  │  ├─ palpites.vue        # Palpites + countdown da rodada aberta
│  │  ├─ ranking.vue         # Dashboard: Ranking Geral + Visão por Rodada
│  │  │                      #   ↳ aba "Visão por Rodada" = tabela cruzada (audit)
│  │  │                      #   ↳ decisão: audit.vue foi unificada aqui por melhor UX
│  │  ├─ regras.vue          # Regras do bolão para os participantes
│  │  └─ admin/
│  │     ├─ index.vue        # Painel admin (hub de módulos)
│  │     ├─ emails.vue       # Lista VIP de e-mails autorizados
│  │     ├─ sync.vue         # Sincronização com Football-Data.org
│  │     └─ rodadas.vue      # Gestão de status das rodadas
│  ├─ utils/
│  │  ├─ formatDate.ts
│  │  └─ calculatePoints.ts
│  ├─ app.vue
│  └─ app.config.ts
├─ shared/
│  ├─ types/
│  │  ├─ Usuario.ts
│  │  ├─ Time.ts
│  │  ├─ Round.ts
│  │  ├─ Match.ts
│  │  └─ Bet.ts
│  └─ constants/
│     └─ scoring.ts
├─ server/
│  ├─ api/
│  │  ├─ sync/
│  │  │  ├─ daily.post.ts        # Cron diário: busca jogos na API-Sports → upsert matches
│  │  │  └─ livescores.post.ts   # Cron de jogo: atualiza placares/status
│  │  ├─ rounds/
│  │  │  ├─ index.get.ts
│  │  │  ├─ index.post.ts        # admin
│  │  │  └─ [id].get.ts
│  │  ├─ matches/
│  │  │  ├─ index.get.ts
│  │  │  └─ [id].patch.ts        # admin: resultado manual
│  │  ├─ bets/
│  │  │  ├─ index.post.ts
│  │  │  └─ [roundId].get.ts
│  │  ├─ ranking/
│  │  │  └─ index.get.ts
│  │  └─ organizer/
│  │     └─ extras.post.ts
│  └─ utils/
│     └─ supabaseAdmin.ts
├─ supabase/
│  └─ schema.sql
├─ nuxt.config.ts
├─ tailwind.config.ts
└─ .env
```

---

## Fase 1: Setup & Banco de Dados

### Comandos de Inicialização

```bash
# 1. Criar projeto Nuxt 4
npx nuxi@latest init +BET

# 2. Instalar dependências
npm install @nuxtjs/supabase @nuxtjs/tailwindcss
npm install -D typescript @types/node
```

### `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },
  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss'],
  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login', '/confirm'],
    },
  },
  typescript: { strict: true },
  runtimeConfig: {
    rapidApiKey: '',        // RAPIDAPI_KEY no .env
    rapidApiHost: 'v3.football.api-sports.io',
    supabaseServiceKey: '', // SUPABASE_SERVICE_KEY no .env
    public: {
      brasileiraoId: 71,   // ID do Brasileirão Série A na API-Sports
    },
  },
})
```

### `.env`

```
SUPABASE_URL=
SUPABASE_KEY=                 # anon key
SUPABASE_SERVICE_KEY=         # service_role key (apenas server)
RAPIDAPI_KEY=
NUXT_PUBLIC_BRASILEIRAO_ID=71
```

---

### Schema SQL Completo (`supabase/schema.sql`)

```sql
-- =========================================
-- TABELAS BASE
-- =========================================

-- Times (fonte da verdade para times do bolão)
CREATE TABLE public.times (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  api_team_id INT NOT NULL UNIQUE,   -- ID exato da API-Sports
  escudo_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Perfis de usuário (extensão de auth.users)
CREATE TABLE public.usuarios (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL,
  is_admin   BOOLEAN NOT NULL DEFAULT false,
  time_id    UUID REFERENCES public.times(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rodadas
CREATE TABLE public.rodadas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_rodada       INT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'aguardando_escolha'
    CHECK (status IN ('aguardando_escolha', 'aberta', 'fechada', 'finalizada')),
  organizer_id        UUID NOT NULL REFERENCES public.usuarios(id),
  organizer_deadline  TIMESTAMPTZ,  -- 12h antes do 1º jogo
  betting_deadline    TIMESTAMPTZ,  -- 1h antes do 1º jogo
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Partidas
CREATE TABLE public.partidas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_match_id  INT NOT NULL UNIQUE,  -- ID da API-Sports (inteiro)
  rodada_id     UUID NOT NULL REFERENCES public.rodadas(id),
  time_casa     TEXT NOT NULL,
  time_fora     TEXT NOT NULL,
  api_team_home_id INT,              -- para referência cruzada
  api_team_away_id INT,
  gols_casa     INT,
  gols_fora     INT,
  status        TEXT NOT NULL DEFAULT 'agendado'
    CHECK (status IN ('agendado', 'finalizado', 'adiado')),
  data_partida  TIMESTAMPTZ NOT NULL,
  is_mandatory  BOOLEAN NOT NULL DEFAULT false,
  is_extra      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Palpites
CREATE TABLE public.palpites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    UUID NOT NULL REFERENCES public.usuarios(id),
  partida_id    UUID NOT NULL REFERENCES public.partidas(id),
  gols_casa_bet INT NOT NULL,
  gols_fora_bet INT NOT NULL,
  pontos        INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(usuario_id, partida_id)
);

-- =========================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================

ALTER TABLE public.times     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rodadas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palpites  ENABLE ROW LEVEL SECURITY;

-- Times: leitura pública
CREATE POLICY "times_select" ON public.times
  FOR SELECT USING (true);

-- Usuários: todos veem; cada um edita o próprio
CREATE POLICY "usuarios_select" ON public.usuarios
  FOR SELECT USING (true);
CREATE POLICY "usuarios_update_own" ON public.usuarios
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "usuarios_insert_own" ON public.usuarios
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Rodadas: leitura pública
CREATE POLICY "rodadas_select" ON public.rodadas
  FOR SELECT USING (true);

-- Partidas: leitura pública
CREATE POLICY "partidas_select" ON public.partidas
  FOR SELECT USING (true);

-- Palpites: usuário vê os próprios + todos veem após bloqueio
CREATE POLICY "palpites_select" ON public.palpites
  FOR SELECT USING (
    auth.uid() = usuario_id
    OR EXISTS (
      SELECT 1 FROM public.rodadas r
      JOIN public.partidas p ON p.rodada_id = r.id
      WHERE p.id = partida_id AND r.status IN ('fechada', 'finalizada')
    )
  );

CREATE POLICY "palpites_insert" ON public.palpites
  FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
    AND EXISTS (
      SELECT 1 FROM public.rodadas r
      JOIN public.partidas p ON p.rodada_id = r.id
      WHERE p.id = partida_id AND r.status = 'aberta'
    )
  );

CREATE POLICY "palpites_update_own" ON public.palpites
  FOR UPDATE USING (
    auth.uid() = usuario_id
    AND EXISTS (
      SELECT 1 FROM public.rodadas r
      JOIN public.partidas p ON p.rodada_id = r.id
      WHERE p.id = partida_id AND r.status = 'aberta'
    )
  );

-- =========================================
-- TRIGGER DE PONTUAÇÃO AUTOMÁTICA
-- =========================================

CREATE OR REPLACE FUNCTION public.calcular_pontos()
RETURNS TRIGGER AS $$
BEGIN
  -- Só processa quando status muda para 'finalizado' ou 'adiado'
  IF NEW.status NOT IN ('finalizado', 'adiado') THEN
    RETURN NEW;
  END IF;

  UPDATE public.palpites p
  SET pontos = CASE
    WHEN NEW.status = 'adiado'                                          THEN 0
    WHEN p.gols_casa_bet = NEW.gols_casa AND p.gols_fora_bet = NEW.gols_fora THEN 3
    WHEN SIGN(p.gols_casa_bet - p.gols_fora_bet) = SIGN(NEW.gols_casa - NEW.gols_fora) THEN 1
    ELSE 0
  END
  WHERE p.partida_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_calcular_pontos
  AFTER UPDATE OF gols_casa, gols_fora, status ON public.partidas
  FOR EACH ROW EXECUTE FUNCTION public.calcular_pontos();

-- =========================================
-- FUNÇÃO: Calcular organizador da rodada
-- (Rodízio por nome em ordem alfabética)
-- =========================================

CREATE OR REPLACE FUNCTION public.get_organizer_for_round(p_numero_rodada INT)
RETURNS UUID AS $$
DECLARE
  v_total INT;
  v_idx   INT;
  v_id    UUID;
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.usuarios;
  v_idx := (p_numero_rodada - 1) % v_total;

  SELECT id INTO v_id
  FROM public.usuarios
  ORDER BY nome ASC
  LIMIT 1 OFFSET v_idx;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
```

---

## Tipos TypeScript (`shared/types/`)

```ts
// shared/types/Time.ts
export interface Time {
  id: string
  nome: string
  api_team_id: number
  escudo_url: string | null
  created_at: string
}

// shared/types/Usuario.ts
export interface Usuario {
  id: string
  nome: string
  email: string
  is_admin: boolean
  time_id: string | null
  created_at: string
  // join opcional
  time?: Time
}

// shared/types/Round.ts
export type RoundStatus = 'aguardando_escolha' | 'aberta' | 'fechada' | 'finalizada'
export interface Round {
  id: string
  numero_rodada: number
  status: RoundStatus
  organizer_id: string
  organizer_deadline: string
  betting_deadline: string
  created_at: string
}

// shared/types/Match.ts
export type MatchStatus = 'agendado' | 'finalizado' | 'adiado'
export interface Match {
  id: string
  api_match_id: number
  rodada_id: string
  time_casa: string
  time_fora: string
  api_team_home_id: number | null
  api_team_away_id: number | null
  gols_casa: number | null
  gols_fora: number | null
  status: MatchStatus
  data_partida: string
  is_mandatory: boolean
  is_extra: boolean
}

// shared/types/Bet.ts
export interface Bet {
  id: string
  usuario_id: string
  partida_id: string
  gols_casa_bet: number
  gols_fora_bet: number
  pontos: number
  created_at: string
}

// shared/types/ApiSports.ts — Mapeamento da resposta da API-Sports
export interface ApiSportsFixture {
  fixture: {
    id: number
    date: string
    status: { short: string }  // 'NS', 'FT', 'PST', '1H', '2H', etc.
  }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
  goals: {
    home: number | null
    away: number | null
  }
}

// shared/constants/scoring.ts
export const POINTS = {
  EXACT: 3,
  RESULT: 1,
  MISS: 0,
} as const
```

---

## Fase 2: Auth PKCE

### `app/pages/login.vue`
- Input de e-mail + botão "Entrar com Magic Link"
- Chama `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '/confirm' } })`
- Estado de feedback (enviando / link enviado)

### `app/pages/confirm.vue`
- `useSupabaseUser()` + `useSupabaseCookieRedirect()` para redirecionar após login
- **Upsert** em `public.usuarios` (cria perfil se for o primeiro acesso)

### Composable `useAuth.ts`
```ts
// Expõe:
const user: Ref<Usuario | null>
const isAdmin: ComputedRef<boolean>
async function login(email: string): Promise<void>
async function logout(): Promise<void>
```

---

## Fase 3: Sincronização com API-Sports

### Arquitetura de Dados

```
[API-Sports] → [server/api/sync/*.post.ts] → [Supabase: partidas]
                                                      ↓ trigger
                                              [Supabase: palpites.pontos]
                                                      ↓
                                              [Frontend via composables]
```

### `server/api/sync/daily.post.ts`
- Protegido por header de segredo (cron secret)
- Busca fixtures do Brasileirão na API-Sports: `GET /fixtures?league=71&season=YYYY&round=X`
- Faz upsert em `public.partidas` (por `api_match_id`)
- Calcula `organizer_deadline` (12h antes do 1º jogo) e `betting_deadline` (1h antes)
- Usa `serverSupabaseServiceRole()` para contornar RLS

### `server/api/sync/livescores.post.ts`
- Roda durante dias de jogo (a cada hora)
- Busca somente fixtures `inplay` ou `short_status: ['1H','HT','2H','ET','P','FT']`
- Atualiza `gols_casa`, `gols_fora`, `status` → dispara trigger de pontos

### Mapeamento de Status API-Sports → Supabase

| API-Sports `short` | Nosso `status` |
|--------------------|----------------|
| `NS` (Not Started) | `agendado` |
| `1H`, `HT`, `2H`, `ET`, `P` | `agendado` (em andamento) |
| `FT`, `AET`, `PEN` | `finalizado` |
| `PST` (Postponed) | `adiado` |
| `CANC`, `ABD` | `adiado` |

---

## Fase 4: Server APIs de Negócio

| Rota | Método | Proteção | Descrição |
|------|--------|----------|-----------|
| `/api/rounds` | GET | auth | Lista rodadas |
| `/api/rounds` | POST | admin | Cria rodada + calcula organizador |
| `/api/rounds/[id]` | GET | auth | Detalhe + verifica deadline do organizador |
| `/api/matches` | GET | auth | Partidas da rodada atual do Supabase |
| `/api/matches/[id]` | PATCH | admin | Resultado manual (fallback da API) |
| `/api/bets` | POST | auth | Salva/atualiza palpite (valida deadline) |
| `/api/bets/[roundId]` | GET | auth | Palpites (respeita RLS) |
| `/api/ranking` | GET | auth | Ranking com lógica de desempate |
| `/api/organizer/extras` | POST | organizer | Salva 2 jogos extras |

---

## Fase 5: UI & Composables

### Composables

| Arquivo | Responsabilidade |
|---------|-----------------|
| `useRound.ts` | Rodada atual, status, deadlines |
| `useBets.ts` | Ler/salvar palpites, validar deadline |
| `useRanking.ts` | Ranking + lógica de desempate (cravados → resultados → sorteio) |
| `useOrganizer.ts` | Verifica se é o organizador, salva extras |
| `useCountdown.ts` | Countdown reativo via `setInterval` até `betting_deadline` |

### Páginas

#### `index.vue` — Dashboard / Ranking
- 🏆 1º lugar: ícone de camisa do time do coração
- 🔥 Penúltimo e último: ícone de churrasqueira
- Rodada atual + status

#### `bets.vue` — Palpites
- Cards de partida com inputs de placar
- `CountdownTimer.vue` até bloqueio
- Inputs desabilitados quando `status = 'fechada'`

#### `organizer.vue` — Escolha de Extras
- Visível apenas para o `organizer_id` da rodada atual
- Lista partidas disponíveis (não obrigatórias) da rodada na API
- Máx. 2 seleções + deadline countdown

#### `audit.vue` — Tabela Cruzada
- Liberada apenas com `status IN ('fechada', 'finalizada')`
- Linhas: usuários | Colunas: partidas
- Células: palpite + pontos

#### `admin.vue` — Painel Admin
- Protegido por `isAdmin` middleware
- Inputs de resultado por partida
- Criar nova rodada (chama `get_organizer_for_round`)

---

## Regras de Negócio — Sumário

```
Jogos por rodada (máx 7):
  Obrigatórios: JOIN usuarios → times → api_team_id filtra na tabela partidas
  Extras: 2 escolhidos pelo organizador da vez

Organizador (rodízio):
  idx = (numero_rodada - 1) % total_usuarios
  Ordenado por nome ASC

Deadlines:
  organizer_deadline = data_partida_mais_cedo - 12h
  betting_deadline   = data_partida_mais_cedo - 1h

Pontuação (trigger automático):
  Placar cravado → 3 pts
  Resultado certo → 1 pt
  Erro / Adiado  → 0 pts

Desempate:
  1. Total de placares cravados
  2. Total de acertos de resultado
  3. Sorteio (implementado no ranking composable)
```

---

## Plano de Verificação

### Fase 1 — DB
- `schema.sql` executado no Supabase Dashboard sem erros
- 5 tabelas criadas; RLS habilitado em todas
- Trigger `trg_calcular_pontos` visível em Database → Functions
- Função `get_organizer_for_round(1)` retorna UUID correto

### Fase 2 — Auth
- Magic Link chega no e-mail → redirect para `/confirm` → redirect para `/`
- Acessar `/admin` sem `is_admin` redireciona para `/`
- Upsert em `public.usuarios` ocorre apenas uma vez (primeiro login)

### Fase 3 — Sync
- `POST /api/sync/daily` upserta partidas corretamente na tabela
- Após `POST /api/sync/livescores` com status `FT`, trigger atualiza pontos nos palpites

### Fase 4 — APIs
- `POST /api/bets` após `betting_deadline` → `403 Forbidden`
- `GET /api/bets/[roundId]` antes do bloqueio → apenas palpites do usuário autenticado

### Fase 5 — UI
- Sem erros de hydration mismatch no console
- Countdown reativo e preciso em `/bets`
- Ícone de camisa no 1º; churrasqueira no penúltimo e último do ranking
