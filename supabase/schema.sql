-- ============================================================
-- +BET — Schema PostgreSQL para Supabase
-- Execute este script no SQL Editor do Supabase Dashboard
-- !! Atenção: Rode seção por seção se preferir validar !!
-- ============================================================


-- ============================================================
-- SEÇÃO 1: EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- SEÇÃO 2: TABELAS
-- ============================================================

-- 2.1 Times (fonte da verdade para times do bolão)
CREATE TABLE public.times (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  api_team_id INT  NOT NULL UNIQUE,   -- ID exato da API-Sports
  escudo_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.times IS 'Times participantes do bolão. api_team_id referencia a API-Sports.';

-- 2.2 Perfis de usuário (extensão de auth.users — 1:1)
CREATE TABLE public.usuarios (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL,
  is_admin   BOOLEAN NOT NULL DEFAULT false,
  time_id    UUID REFERENCES public.times(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.usuarios IS 'Perfis públicos. id é FK de auth.users (Supabase Auth).';
COMMENT ON COLUMN public.usuarios.is_admin IS 'Configurado manualmente pelo DBA. Não há tela de promoção.';

-- 2.3 Rodadas
CREATE TABLE public.rodadas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_rodada       INT  NOT NULL,
  status              TEXT NOT NULL DEFAULT 'aguardando_escolha'
    CONSTRAINT rodadas_status_check
      CHECK (status IN ('aguardando_escolha', 'aberta', 'fechada', 'finalizada')),
  organizer_id        UUID NOT NULL REFERENCES public.usuarios(id),
  organizer_deadline  TIMESTAMPTZ,   -- 12h antes do 1º jogo
  betting_deadline    TIMESTAMPTZ,   -- 1h antes do 1º jogo
  required_extra_games INT NOT NULL DEFAULT 2,
  fase                TEXT DEFAULT 'grupos',
  multiplicador       NUMERIC(3,1) DEFAULT 1.0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.rodadas IS 'Rodada do Brasileirão. Cada rodada tem um organizador em rodízio.';

-- 2.4 Partidas
CREATE TABLE public.partidas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_match_id     INT  NOT NULL,              -- ID da API-Sports (inteiro)
  rodada_id        UUID NOT NULL REFERENCES public.rodadas(id) ON DELETE CASCADE,
  time_casa        TEXT NOT NULL,
  time_fora        TEXT NOT NULL,
  api_team_home_id INT,                    -- para join com public.times
  api_team_away_id INT,
  gols_casa        INT,
  gols_fora        INT,
  status           TEXT NOT NULL DEFAULT 'agendado'
    CONSTRAINT partidas_status_check
      CHECK (status IN ('agendado', 'finalizado', 'adiado')),
  data_partida     TIMESTAMPTZ NOT NULL,
  is_mandatory     BOOLEAN NOT NULL DEFAULT false,
  is_extra         BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.partidas IS 'Partidas sincronizadas da API-Sports. api_match_id é chave universal.';

-- 2.5 Palpites
CREATE TABLE public.palpites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    UUID NOT NULL REFERENCES public.usuarios(id)  ON DELETE CASCADE,
  partida_id    UUID NOT NULL REFERENCES public.partidas(id)  ON DELETE CASCADE,
  gols_casa_bet INT  NOT NULL,
  gols_fora_bet INT  NOT NULL,
  pontos        INT  NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT palpites_unique_bet UNIQUE (usuario_id, partida_id)
);
COMMENT ON TABLE public.palpites IS 'Um palpite por usuário por partida. pontos calculados pelo trigger.';

-- 2.6 Palpites Especiais (Copa)
CREATE TABLE public.palpites_especiais (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    UUID NOT NULL REFERENCES public.usuarios(id)  ON DELETE CASCADE,
  campeonato_id UUID NOT NULL REFERENCES public.campeonatos(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL,           -- 'campeao', 'artilheiro', 'melhor_grupo_X'
  valor         TEXT NOT NULL,
  api_team_id   INT,
  pontos        INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT palpites_especiais_unique UNIQUE (usuario_id, campeonato_id, tipo)
);
COMMENT ON TABLE public.palpites_especiais IS 'Palpites bônus (Copa do Mundo).';


-- ============================================================
-- SEÇÃO 3: INDEXES
-- ============================================================
CREATE INDEX idx_partidas_rodada_id    ON public.partidas (rodada_id);
CREATE INDEX idx_partidas_api_match_id ON public.partidas (api_match_id);
-- Constraint composta: mesma partida pode existir em rodadas de campeonatos diferentes
ALTER TABLE public.partidas ADD CONSTRAINT partidas_api_match_rodada_unique UNIQUE (api_match_id, rodada_id);
CREATE INDEX idx_palpites_usuario_id   ON public.palpites (usuario_id);
CREATE INDEX idx_palpites_partida_id   ON public.palpites (partida_id);
CREATE INDEX idx_rodadas_status        ON public.rodadas  (status);
CREATE INDEX idx_usuarios_time_id      ON public.usuarios (time_id);


-- ============================================================
-- SEÇÃO 4: ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.times     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rodadas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palpites  ENABLE ROW LEVEL SECURITY;

-- ---- times ----
CREATE POLICY "times_leitura_publica" ON public.times
  FOR SELECT USING (true);

-- ---- usuarios ----
CREATE POLICY "usuarios_leitura_publica" ON public.usuarios
  FOR SELECT USING (true);

CREATE POLICY "usuarios_insert_proprio" ON public.usuarios
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "usuarios_update_proprio" ON public.usuarios
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "usuarios_admin_update" ON public.usuarios
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
  );

-- ---- rodadas ----
CREATE POLICY "rodadas_leitura_publica" ON public.rodadas
  FOR SELECT USING (true);

-- ---- partidas ----
CREATE POLICY "partidas_leitura_publica" ON public.partidas
  FOR SELECT USING (true);

-- ---- palpites ----
-- Usuário vê os próprios palpites SEMPRE
-- Vê os de todos somente após a rodada ser 'fechada' ou 'finalizada'
CREATE POLICY "palpites_select" ON public.palpites
  FOR SELECT USING (
    auth.uid() = usuario_id
    OR EXISTS (
      SELECT 1
      FROM   public.rodadas r
      JOIN   public.partidas p ON p.rodada_id = r.id
      WHERE  p.id = partida_id
        AND  r.status IN ('fechada', 'finalizada')
    )
  );

-- Só pode inserir enquanto a rodada está 'aberta'
CREATE POLICY "palpites_insert" ON public.palpites
  FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
    AND EXISTS (
      SELECT 1
      FROM   public.rodadas r
      JOIN   public.partidas p ON p.rodada_id = r.id
      WHERE  p.id = partida_id
        AND  r.status = 'aberta'
    )
  );

-- Pode atualizar palpite já existente enquanto a rodada está 'aberta'
CREATE POLICY "palpites_update_proprio" ON public.palpites
  FOR UPDATE USING (
    auth.uid() = usuario_id
    AND EXISTS (
      SELECT 1
      FROM   public.rodadas r
      JOIN   public.partidas p ON p.rodada_id = r.id
      WHERE  p.id = partida_id
        AND  r.status = 'aberta'
    )
  );


-- ============================================================
-- SEÇÃO 5: FUNCTIONS & TRIGGERS
-- ============================================================

-- 5.1 Trigger: Calcular pontos automaticamente ao atualizar resultado
-- ⚠️  ÚNICA fonte de verdade para pontuação. Nunca calcule pontos em TypeScript.
--     Qualquer mudança nos valores (3/1/0) deve ser feita AQUI e atualizada
--     em shared/constants/scoring.ts para manter paridade de documentação.
CREATE OR REPLACE FUNCTION public.calcular_pontos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Guard: só processa quando status muda para 'finalizado' ou 'adiado'
  IF NEW.status NOT IN ('finalizado', 'adiado') THEN
    RETURN NEW;
  END IF;

  -- Guard crítico: se 'finalizado' mas gols são NULL, os dados estão incompletos.
  -- Não processa para evitar zerar pontos indevidamente.
  IF NEW.status = 'finalizado' AND (NEW.gols_casa IS NULL OR NEW.gols_fora IS NULL) THEN
    RAISE WARNING 'calcular_pontos: partida % marcada como finalizado mas gols são NULL. Pontuação não processada.', NEW.id;
    RETURN NEW;
  END IF;

  UPDATE public.palpites p
  SET pontos = CASE
    -- Partida adiada: 0 pts para todos
    WHEN NEW.status = 'adiado'
      THEN 0
    -- Placar cravado: 3 pts
    WHEN p.gols_casa_bet = NEW.gols_casa
     AND p.gols_fora_bet = NEW.gols_fora
      THEN 3
    -- Resultado certo (sinal: positivo=casa vence, negativo=fora vence, zero=empate): 1 pt
    WHEN SIGN(p.gols_casa_bet - p.gols_fora_bet) = SIGN(NEW.gols_casa - NEW.gols_fora)
      THEN 1
    -- Erro
    ELSE 0
  END
  WHERE p.partida_id = NEW.id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.calcular_pontos IS
  'ÚNICA fonte de verdade para cálculo de pontos. Dispara via trigger após UPDATE de gols_casa, gols_fora ou status em public.partidas. Possui guard para status inválido e gols NULL.';

CREATE TRIGGER trg_calcular_pontos
  AFTER UPDATE OF gols_casa, gols_fora, status ON public.partidas
  FOR EACH ROW
  EXECUTE FUNCTION public.calcular_pontos();


-- 5.2 Function: Retornar o organizador da rodada (rodízio por nome)
--     Se p_campeonato_id for informado, sorteia entre os participantes daquele campeonato.
--     Senão, sorteia entre todos os não-admin (legado).
CREATE OR REPLACE FUNCTION public.get_organizer_for_round(p_numero_rodada INT, p_campeonato_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INT;
  v_idx   INT;
  v_id    UUID;
BEGIN
  IF p_campeonato_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_total
    FROM public.campeonato_acessos ca
    JOIN public.usuarios u ON u.email = ca.email
    WHERE ca.campeonato_id = p_campeonato_id
      AND u.is_admin = false;

    IF v_total = 0 THEN
      SELECT COUNT(*) INTO v_total FROM public.usuarios WHERE is_admin = false;
      IF v_total = 0 THEN
        RAISE EXCEPTION 'Nenhum usuário cadastrado.';
      END IF;
      v_idx := (p_numero_rodada - 1) % v_total;
      SELECT id INTO v_id
      FROM public.usuarios
      WHERE is_admin = false
      ORDER BY nome ASC
      LIMIT 1 OFFSET v_idx;
    ELSE
      v_idx := (p_numero_rodada - 1) % v_total;
      SELECT u.id INTO v_id
      FROM public.campeonato_acessos ca
      JOIN public.usuarios u ON u.email = ca.email
      WHERE ca.campeonato_id = p_campeonato_id
        AND u.is_admin = false
      ORDER BY u.nome ASC
      LIMIT 1 OFFSET v_idx;
    END IF;
  ELSE
    SELECT COUNT(*) INTO v_total FROM public.usuarios WHERE is_admin = false;
    IF v_total = 0 THEN
      RAISE EXCEPTION 'Nenhum usuário cadastrado.';
    END IF;
    v_idx := (p_numero_rodada - 1) % v_total;
    SELECT id INTO v_id
    FROM public.usuarios
    WHERE is_admin = false
    ORDER BY nome ASC
    LIMIT 1 OFFSET v_idx;
  END IF;

  RETURN v_id;
END;
$$;
COMMENT ON FUNCTION public.get_organizer_for_round IS
  'Retorna o UUID do organizador para uma dada rodada. Se p_campeonato_id for informado, sorteia entre os participantes. Senão, todos os não-admin.';


-- 5.3 Function: Criar perfil de usuário automaticamente após signup
-- (Dispara via trigger no auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- SEÇÃO 6: VIEW — Ranking geral
-- (Facilita queries no composable useRanking)
-- ============================================================
CREATE OR REPLACE VIEW public.vw_ranking AS
SELECT
  u.id                          AS usuario_id,
  u.nome,
  u.time_id,
  t.nome                        AS time_nome,
  t.escudo_url,
  COALESCE(SUM(p.pontos), 0)    AS total_pontos,
  COUNT(CASE WHEN p.pontos = 3 THEN 1 END) AS total_cravados,
  COUNT(CASE WHEN p.pontos = 1 THEN 1 END) AS total_acertos,
  COUNT(p.id)                   AS total_palpites
FROM public.usuarios u
LEFT JOIN public.times   t  ON t.id = u.time_id
LEFT JOIN public.palpites p ON p.usuario_id = u.id
WHERE u.is_admin = false
GROUP BY u.id, u.nome, u.time_id, t.nome, t.escudo_url
ORDER BY
  total_pontos  DESC,
  total_cravados DESC,
  total_acertos  DESC,
  u.nome         ASC;   -- desempate final por nome (antes do sorteio)

COMMENT ON VIEW public.vw_ranking IS
  'Ranking geral. Desempate: pontos → cravados → acertos → sorteio (implementado no backend).';


-- ============================================================
-- SEÇÃO 7: PRÉ-CADASTRO (Auth)
-- ============================================================
CREATE TABLE public.email_autorizados (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  nome_ref      TEXT,          -- referência opcional (ex: "João Silva")
  autorizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.email_autorizados IS 'Lista de e-mails pré-autorizados a criar conta no +BET.';

ALTER TABLE public.email_autorizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_autorizados_admin_all" ON public.email_autorizados
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
-- Próximos passos:
--   1. Inserir os times do bolão em public.times
--   2. Criar o primeiro admin manualmente: UPDATE public.usuarios SET is_admin = true WHERE email = 'seu@email.com'
--   3. Configurar as variáveis de ambiente no .env
-- ============================================================
