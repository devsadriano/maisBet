# 🏆 Plano de Implementação: Multi-Campeonato + Scoring Dinâmico

> **INSTRUÇÕES PARA QUALQUER IA (Claude, Gemini, etc.):**
> Este documento é um guia passo-a-passo autocontido. Cada PASSO é independente e deve ser concluído por completo antes de avançar para o próximo. Marque `[x]` quando concluir cada passo. O contexto do projeto está descrito abaixo para que qualquer IA entenda sem precisar de conversas anteriores.

---

## 📋 Contexto do Projeto (Leia primeiro!)

O **+BET** é um aplicativo de bolão entre amigos construído com:
- **Framework:** Nuxt 4 (Vue 3 + Nitro server routes)
- **Backend/DB:** Supabase (PostgreSQL + Auth + Edge Functions)
- **API de dados:** Football-Data.org (v4)
- **Auth:** Login por email/senha via Supabase Auth
- **Deploy:** Vercel (frontend) / Supabase (DB + Edge Functions)

### Problema Atual
O sistema foi construído para um **ÚNICO** campeonato (Brasileirão 2026):
- O código da competição `BSA` está hardcoded em `start-championship.post.ts` e `auto-cycle/index.ts`
- A temporada `2025` está hardcoded em `nuxt.config.ts`
- As tabelas `rodadas` e `partidas` não possuem referência a qual campeonato pertencem
- A pontuação é fixa (3 pts placar exato, 1 pt vencedor correto, 0 pts errou)
- Não existe entidade "campeonato" no banco de dados

### Objetivo
Transformar o +BET em um sistema que suporte **múltiplos campeonatos simultâneos** (ex: Brasileirão 2026 + Copa do Mundo 2026) com **sistemas de pontuação configuráveis** por campeonato.

---

## 📂 Arquivos Impactados (Referência Rápida)

| Arquivo | Tipo de Mudança | O que muda |
|---|---|---|
| `shared/types/Round.ts` | MODIFY | Adicionar `campeonato_id` |
| `shared/types/Match.ts` | MODIFY | Nenhum (herda via rodada) |
| `shared/types/Usuario.ts` | MODIFY | Nenhum por ora |
| `app/composables/useRanking.ts` | MODIFY | Filtrar por campeonato + scoring dinâmico |
| `app/composables/useRoundRanking.ts` | MODIFY | Filtrar rodadas por campeonato |
| `app/composables/useBets.ts` | MODIFY | Buscar rodada ativa do campeonato selecionado |
| `app/pages/index.vue` | MODIFY | Seletor de campeonato |
| `app/pages/palpites.vue` | MODIFY | Escopo por campeonato |
| `app/pages/ranking.vue` | MODIFY | Escopo por campeonato |
| `app/pages/admin/sync.vue` | MODIFY | Exibir status por campeonato |
| `server/api/admin/start-championship.post.ts` | MODIFY | Receber `competition_code` + `season` do body |
| `server/api/rounds/setup.post.ts` | NENHUM | Já opera por `rodada_id` |
| `supabase/functions/auto-cycle/index.ts` | MODIFY | Loop por campeonatos ativos |
| `nuxt.config.ts` | MODIFY | Remover hardcodes de liga/temporada |

---

## 🔢 PASSOS DE IMPLEMENTAÇÃO

---

### PASSO 1: Criar tabelas `campeonatos` e `scoring_systems` no banco
**Status:** `[x]` Concluído

**O que fazer:**
Criar uma migration SQL no Supabase com duas novas tabelas.

**SQL a executar:**
```sql
-- Tabela de sistemas de pontuação
CREATE TABLE scoring_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  regras JSONB NOT NULL DEFAULT '{
    "placar_exato": 3,
    "vencedor_correto": 1,
    "errou": 0
  }',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir os 3 presets
INSERT INTO scoring_systems (nome, descricao, regras, is_default) VALUES
(
  'Clássico',
  'Placar exato vale 3 pontos, vencedor correto vale 1 ponto.',
  '{"placar_exato": 3, "vencedor_correto": 1, "errou": 0}',
  true
),
(
  'Equilibrado',
  'Pontuação mais granular com bônus para diferença de gols.',
  '{"placar_exato": 10, "vencedor_e_diferenca": 7, "vencedor_ou_empate": 5, "errou": 0}',
  false
),
(
  'Simples',
  'Placar exato vale 10 pontos, vencedor independente do placar vale 7.',
  '{"placar_exato": 10, "vencedor_correto": 7, "empate_sem_placar": 5, "errou": 0}',
  false
);

-- Tabela de campeonatos
CREATE TABLE campeonatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  api_competition_code TEXT NOT NULL,
  season INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('rascunho', 'ativo', 'finalizado', 'arquivado')),
  scoring_system_id UUID REFERENCES scoring_systems(id),
  max_rodadas INTEGER DEFAULT 38,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (api_competition_code, season)
);

-- RLS
ALTER TABLE campeonatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler campeonatos"
  ON campeonatos FOR SELECT USING (true);

CREATE POLICY "Admins gerenciam campeonatos"
  ON campeonatos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Todos podem ler scoring_systems"
  ON scoring_systems FOR SELECT USING (true);

CREATE POLICY "Admins gerenciam scoring_systems"
  ON scoring_systems FOR ALL
  USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND is_admin = true)
  );
```

**Validação:** Verificar no Supabase Dashboard que as tabelas e os 3 presets existem.

---

### PASSO 2: Adicionar `campeonato_id` na tabela `rodadas`
**Status:** `[x]` Concluído

**O que fazer:**
Criar uma migration SQL no Supabase para adicionar a coluna e o índice.

**SQL a executar:**
```sql
-- Adicionar coluna (nullable por enquanto para não quebrar dados existentes)
ALTER TABLE rodadas ADD COLUMN campeonato_id UUID REFERENCES campeonatos(id);

-- Criar índice para performance nas queries filtradas
CREATE INDEX idx_rodadas_campeonato ON rodadas(campeonato_id);
```

**⚠️ IMPORTANTE:** NÃO adicionar `NOT NULL` ainda. Se já existirem rodadas no banco (do Brasileirão atual), elas ficarão com `campeonato_id = NULL` temporariamente. Isso será resolvido no PASSO 3.

**Validação:** Confirmar que a coluna existe na tabela `rodadas` no Supabase.

---

### PASSO 3: Migrar dados existentes (Brasileirão atual)
**Status:** `[x]` Concluído

**O que fazer:**
Criar um registro de campeonato para o Brasileirão atual e vincular todas as rodadas existentes a ele.

**SQL a executar:**
```sql
-- Criar o campeonato do Brasileirão atual
INSERT INTO campeonatos (nome, api_competition_code, season, status, max_rodadas, scoring_system_id)
SELECT
  'Brasileirão Série A 2026',
  'BSA',
  2026,
  'ativo',
  38,
  id
FROM scoring_systems WHERE nome = 'Clássico';

-- Vincular TODAS as rodadas existentes a esse campeonato
UPDATE rodadas
SET campeonato_id = (SELECT id FROM campeonatos WHERE api_competition_code = 'BSA' AND season = 2026)
WHERE campeonato_id IS NULL;

-- Agora sim, tornar a coluna NOT NULL
ALTER TABLE rodadas ALTER COLUMN campeonato_id SET NOT NULL;
```

**Validação:** Executar `SELECT * FROM rodadas WHERE campeonato_id IS NULL` e confirmar que retorna 0 linhas.

---

### PASSO 4: Criar shared types para Campeonato e ScoringSystem
**Status:** `[x]` Concluído

**O que fazer:**
Criar dois novos arquivos de tipagem TypeScript.

**Arquivo:** `shared/types/Campeonato.ts`
```typescript
export type CampeonatoStatus = 'rascunho' | 'ativo' | 'finalizado' | 'arquivado'

export interface ScoringSystem {
  id: string
  nome: string
  descricao: string | null
  regras: Record<string, number>  // ex: { placar_exato: 3, vencedor_correto: 1, errou: 0 }
  is_default: boolean
}

export interface Campeonato {
  id: string
  nome: string
  api_competition_code: string
  season: number
  status: CampeonatoStatus
  scoring_system_id: string | null
  max_rodadas: number
  created_by: string | null
  created_at: string
  // Relações (joins)
  scoring_system?: ScoringSystem
}
```

**Arquivo:** `shared/types/Round.ts` — **MODIFICAR** para adicionar `campeonato_id`:
```typescript
// Adicionar na interface Round:
campeonato_id: string
```

**Validação:** Verificar que `npm run dev` não dá erros de tipagem.

---

### PASSO 5: Criar composable `useCampeonato.ts`
**Status:** `[x]` Concluído

**O que fazer:**
Criar um composable que gerencia qual campeonato está selecionado atualmente. Esse composable será usado por TODOS os outros composables (useBets, useRanking, etc.) para saber o escopo.

**Arquivo:** `app/composables/useCampeonato.ts`

**Funcionalidades:**
- `campeonatos` — lista de campeonatos ativos (carregados do banco)
- `campeonatoAtivo` — o campeonato atualmente selecionado pelo usuário (salvo em `useState` para persistência entre páginas)
- `fetchCampeonatos()` — carrega a lista do Supabase
- `selecionarCampeonato(id)` — troca o campeonato ativo
- `scoringSystem` — computed com as regras de pontuação do campeonato ativo

**Lógica:**
```typescript
// 1. Buscar campeonatos com status 'ativo'
// 2. Se só tem 1 ativo, selecionar automaticamente
// 3. Se tem mais de 1, mostrar seletor (UI será no PASSO 9)
// 4. Salvar seleção em useState('campeonato-ativo')
```

**Validação:** Console.log no `onMounted` da Home confirmando que o composable retorna o campeonato correto.

---

### PASSO 6: Atualizar `useBets.ts` para filtrar por campeonato
**Status:** `[ ]` Pendente

**O que fazer:**
Modificar o composable de apostas para buscar apenas a rodada ativa do campeonato selecionado.

**Mudanças no arquivo** `app/composables/useBets.ts`:

1. Importar `useCampeonato`
2. Na query de `fetchInitialData`, adicionar join/filtro:
   - Antes: `.eq('status', 'aberta')`
   - Depois: `.eq('status', 'aberta')` E a rodada pertence ao `campeonatoAtivo.id`

**Query atualizada (pseudo-código):**
```typescript
const { campeonatoAtivo } = useCampeonato()

// Buscar rodada ativa do campeonato selecionado
const { data: r } = await supabase
  .from('rodadas')
  .select('id, numero_rodada, status, betting_deadline, campeonato_id, partidas(*)')
  .eq('status', 'aberta')
  .eq('campeonato_id', campeonatoAtivo.value.id) // ← NOVO
  .order('numero_rodada', { ascending: true })
  .limit(1)
  .single()
```

**Validação:** Abrir a página de palpites e confirmar que só mostra a rodada do campeonato correto.

---

### PASSO 7: Atualizar `useRanking.ts` para scoring dinâmico
**Status:** `[x]` Concluído

**O que fazer:**
Modificar o composable de ranking para:
1. Filtrar palpites por campeonato (via rodadas do campeonato ativo)
2. Usar as regras de pontuação do `scoring_system` do campeonato em vez dos valores hardcoded

**Mudanças no arquivo** `app/composables/useRanking.ts`:

1. Importar `useCampeonato`
2. Na query de palpites, adicionar join com rodadas para filtrar por `campeonato_id`
3. Substituir os checks hardcoded (`if (b.pontos === 3) cravados++`) pela leitura dinâmica do `scoring_system.regras`

**Lógica de scoring dinâmico (pseudo-código):**
```typescript
const { campeonatoAtivo } = useCampeonato()
const regras = campeonatoAtivo.value.scoring_system?.regras

// Ao contar acertos:
// Antes: if (b.pontos === 3) cravados++
// Depois: if (b.pontos === regras.placar_exato) cravados++
// Antes: if (b.pontos === 1) acertos++
// Depois: if (b.pontos === regras.vencedor_correto) acertos++
```

**⚠️ NOTA:** A **atribuição** dos pontos (calcular quanto vale cada palpite) é feita no momento de processamento do resultado (quando a partida finaliza). Hoje isso não está explícito no frontend — os pontos já vêm calculados do banco (coluna `palpites.pontos`). Se quisermos scoring dinâmico REAL, o cálculo de pontos precisa acontecer no `auto-cycle` ou numa trigger. Isso é tratado no **PASSO 8**.

**Validação:** O ranking deve exibir os mesmos valores de antes (já que o sistema de scoring padrão não mudou).

---

### PASSO 8: Atualizar cálculo de pontos no `auto-cycle` (via Trigger do Banco)
**Status:** `[x]` Concluído

**O que fazer:**
Quando o `auto-cycle` finaliza uma partida (ETAPA 1 - Sync Results), ele precisa recalcular os pontos dos palpites baseado no `scoring_system` do campeonato. Hoje os pontos são calculados... (verificar se há uma trigger no banco ou se é feito manualmente).

**Investigação necessária:**
1. Verificar se existe uma trigger SQL que calcula `palpites.pontos` automaticamente quando `partidas.status` muda para `finalizado`
2. Se não existir, criar uma função SQL ou adicionar a lógica no `auto-cycle`

**Lógica de cálculo (baseada no scoring_system):**
```sql
-- Pseudo-SQL: calcular pontos de um palpite
FUNCTION calcular_pontos(
  gols_casa_real, gols_fora_real,
  gols_casa_bet, gols_fora_bet,
  regras JSONB
) RETURNS INTEGER AS $$
  -- Placar exato
  IF gols_casa_bet = gols_casa_real AND gols_fora_bet = gols_fora_real THEN
    RETURN regras->>'placar_exato'
  END IF;
  -- Vencedor correto
  IF SIGN(gols_casa_bet - gols_fora_bet) = SIGN(gols_casa_real - gols_fora_real) THEN
    RETURN regras->>'vencedor_correto'
  END IF;
  -- Errou
  RETURN regras->>'errou';
$$
```

**Opção recomendada:** Criar uma **stored procedure** `calcular_pontos_rodada(rodada_id UUID)` no PostgreSQL que:
1. Busca o `campeonato_id` da rodada
2. Busca o `scoring_system` do campeonato
3. Recalcula `palpites.pontos` para todas as partidas finalizadas daquela rodada

O `auto-cycle` então chama essa stored procedure após atualizar os placares.

**Validação:** Inserir um palpite de teste e confirmar que os pontos são calculados corretamente com as regras do campeonato.

---

### PASSO 9: Criar UI de seleção de campeonato
**Status:** `[x]` Concluído

**O que fazer:**
Adicionar um seletor visual na Home (`index.vue`) e nas páginas de palpites/ranking para que o usuário escolha qual campeonato está jogando.

**Design proposto:**
- Um **dropdown** estilizado no topo da sidebar ou no header
- Ou **cards** na Home tipo "Brasileirão 2026" / "Copa do Mundo 2026"
- Se só existir 1 campeonato ativo, o seletor fica escondido (comportamento atual)

**Arquivos a modificar:**
- `app/pages/index.vue` — Adicionar seletor ou cards de campeonato
- `app/pages/palpites.vue` — Usar o campeonato do composable
- `app/pages/ranking.vue` — Usar o campeonato do composable

**Validação:** Navegar entre dois campeonatos e ver que os dados (rodadas, palpites, ranking) mudam.

---

### PASSO 10: Atualizar `start-championship.post.ts` para receber parâmetros
**Status:** `[x]` Concluído

**O que fazer:**
Remover os hardcodes de `BSA` e receber o `campeonato_id` do body da requisição.

**Mudanças no arquivo** `server/api/admin/start-championship.post.ts`:

1. Receber no body: `{ campeonato_id: string }`
2. Buscar o campeonato no banco para obter `api_competition_code` e `season`
3. Usar esses valores na chamada da API Football-Data ao invés de `BSA` hardcoded
4. Ao inserir rodadas, incluir o `campeonato_id`
5. A verificação de idempotência agora filtra por `campeonato_id` (pode ter rodadas de OUTRO campeonato)

**Validação:** Criar um campeonato de teste e iniciar via admin.

---

### PASSO 11: Atualizar `auto-cycle` para multi-campeonato
**Status:** `[x]` Concluído

**O que fazer:**
Modificar a Edge Function para iterar sobre TODOS os campeonatos com `status = 'ativo'`.

**Mudanças no arquivo** `supabase/functions/auto-cycle/index.ts`:

**Antes:**
```
ETAPA 1 → busca partidas com status 'agendado' (global)
ETAPA 2 → busca rodadas 'aberta' ou 'fechada' (global)
ETAPA 4 → importa próxima rodada com código BSA hardcoded
```

**Depois:**
```
// Buscar todos os campeonatos ativos
const { data: campeonatos } = await supabase
  .from('campeonatos')
  .select('*, scoring_systems(*)')
  .eq('status', 'ativo')

for (const campeonato of campeonatos) {
  ETAPA 1 → busca partidas do campeonato (via rodadas.campeonato_id)
  ETAPA 2 → busca rodadas do campeonato
  ETAPA 3 → transições do campeonato
  ETAPA 4 → importa próxima rodada usando campeonato.api_competition_code
  ETAPA 5 → calcular pontos usando campeonato.scoring_system
}
ETAPA 6 → gravar log
```

**⚠️ CUIDADO:** A API Football-Data tem limite de 10 requisições/minuto. Se houver 2+ campeonatos, o delay entre chamadas precisa ser respeitado.

**Validação:** Verificar logs do `auto-cycle` mostrando processamento de múltiplos campeonatos.

---

### PASSO 12: Criar UI Admin para gerenciar campeonatos
**Status:** `[x]` Concluído

**O que fazer:**
Criar uma nova página admin para o administrador criar e gerenciar campeonatos.

**Arquivo novo:** `app/pages/admin/campeonatos.vue`

**Funcionalidades:**
- Listar campeonatos existentes (com status e scoring system)
- Botão "Criar Novo Campeonato" que abre um form/modal com:
  - Nome do campeonato
  - Código da competição na API (dropdown: BSA, WC, CL, etc.)
  - Temporada (ano)
  - Sistema de pontuação (dropdown com os presets)
  - Máximo de rodadas
- Botão "Iniciar" (chama `start-championship` com o `campeonato_id`)
- Botão "Arquivar" para campeonatos finalizados

**Validação:** Criar um campeonato "Copa do Mundo 2026" via UI admin e verificar no banco.

---

### PASSO 13: Atualizar `useRoundRanking.ts` para filtrar por campeonato
**Status:** `[x]` Concluído

**O que fazer:**
Modificar para que o dropdown de rodadas mostre apenas as rodadas do campeonato ativo.

**Mudanças:**
```typescript
const { campeonatoAtivo } = useCampeonato()

const fetchRounds = async () => {
  const { data } = await supabase
    .from('rodadas')
    .select('id, numero_rodada, status')
    .eq('campeonato_id', campeonatoAtivo.value.id) // ← NOVO
    .order('numero_rodada', { ascending: false })
  rounds.value = data || []
}
```

**Validação:** Na page de ranking, o seletor de rodadas mostra apenas as do campeonato selecionado.

---

### PASSO 14: Atualizar Home (`index.vue`) para multi-campeonato
**Status:** `[x]` Concluído

**O que fazer:**
Atualizar a busca da rodada ativa na Home para filtrar por campeonato.

**Mudanças:**
- A query `activeRound` precisa filtrar por `campeonato_id`
- O banner do organizador e o CTA de palpites devem refletir o campeonato selecionado
- Se houver 2+ campeonatos ativos, mostrar um card para cada

**Validação:** A Home mostra corretamente o CTA e timers do campeonato ativo.

---

### PASSO 15: Limpar hardcodes remanescentes
**Status:** `[x]` Concluído

**O que fazer:**
Buscar em todo o projeto por referências hardcoded e removê-las.

**Buscar por:**
- `BSA` em arquivos `.ts` e `.vue`
- `brasileiraoLeagueId` em `nuxt.config.ts`
- `brasileiraoSeason` em `nuxt.config.ts`
- `competitions/BSA` em qualquer arquivo
- Referências a `rodada 38` como "última" (agora depende de `campeonato.max_rodadas`)

**Validação:** Grep global confirmando que não existem mais hardcodes de competição.

---

### PASSO 16: Testes E2E
**Status:** `[x]` Concluído

**O que fazer:**
Testar o fluxo completo:
1. Admin cria campeonato "Copa do Mundo 2026" com scoring "Equilibrado"
2. Admin inicia o campeonato (importa rodada atual)
3. Jogador seleciona o campeonato na Home
4. Jogador faz palpite
5. Auto-cycle processa resultados e calcula pontos com scoring correto
6. Ranking mostra dados corretos para cada campeonato separadamente

**Validação:** Todos os 6 passos funcionam sem erro.

---

## 📊 Resumo de Progresso

| Passo | Descrição | Status |
|---|---|---|
| 1 | Criar tabelas `campeonatos` e `scoring_systems` | `[x]` |
| 2 | Adicionar `campeonato_id` na `rodadas` | `[x]` |
| 3 | Migrar dados existentes | `[x]` |
| 4 | Shared types (Campeonato, ScoringSystem) | `[x]` |
| 5 | Composable `useCampeonato.ts` | `[x]` |
| 6 | Atualizar `useBets.ts` | `[x]` |
| 7 | Atualizar `useRanking.ts` (scoring dinâmico) | `[x]` |
| 8 | Atualizar cálculo de pontos no `auto-cycle` | `[x]` |
| 9 | UI seleção de campeonato | `[x]` |
| 10 | Atualizar `start-championship.post.ts` | `[x]` |
| 11 | Atualizar `auto-cycle` para multi-campeonato | `[x]` |
| 12 | UI Admin para gerenciar campeonatos | `[x]` |
| 13 | Atualizar `useRoundRanking.ts` | `[x]` |
| 14 | Atualizar Home `index.vue` | `[x]` |
| 15 | Limpar hardcodes | `[x]` |
| 16 | Testes E2E | `[x]` |

---

## ⚠️ Notas Importantes

1. **Ordem é CRÍTICA:** Os passos 1-3 (banco) DEVEM ser feitos antes de qualquer mudança no frontend/backend.
2. **Retrocompatibilidade:** O PASSO 3 garante que dados existentes não sejam perdidos.
3. **Copa do Mundo:** Usa formato diferente (grupos + mata-mata). Para v1, trataremos como "rodadas" lineares (Fase de Grupos = Rodada 1-3, Oitavas = Rodada 4, etc.). Um suporte real a fases eliminatórias seria um PASSO futuro.
4. **API Football-Data:** Códigos de competição relevantes:
   - `BSA` = Brasileirão Série A
   - `WC` = Copa do Mundo FIFA
   - `CL` = UEFA Champions League
   - `BSB` = Brasileirão Série B
   - `CLI` = Copa Libertadores
5. **Scoring:** A coluna `palpites.pontos` continuará existindo, mas o VALOR será calculado dinamicamente baseado no `scoring_system` do campeonato.
