-- ============================================================
-- +BET — Schema PostgreSQL para Supabase
-- Fonte Única de Verdade (Single Source of Truth)
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

-- ============================================================
-- SEÇÃO 1: EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SEÇÃO 2: TABELAS E RESTRIÇÕES
-- ============================================================

-- 2.1 Times (fonte de dados dos escudos e nomes oficiais)
CREATE TABLE IF NOT EXISTS public.times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    api_team_id INTEGER NOT NULL UNIQUE,
    escudo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.times IS 'Times cadastrados e sincronizados via API.';

-- 2.2 Perfis de usuário (extensão de auth.users — 1:1)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'ativo',
    telefone TEXT,
    cidade TEXT,
    estado VARCHAR(255)
);
COMMENT ON TABLE public.usuarios IS 'Perfis públicos estendendo auth.users do Supabase.';

-- 2.3 Sistemas de Pontuação (Scoring Systems)
CREATE TABLE IF NOT EXISTS public.scoring_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    regras JSONB NOT NULL DEFAULT '{"errou": 0, "placar_exato": 3, "vencedor_correto": 1}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.scoring_systems IS 'Definições dinâmicas de regras de pontuação para campeonatos.';

-- 2.4 Campeonatos (Bolões)
CREATE TABLE IF NOT EXISTS public.campeonatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    api_competition_code TEXT NOT NULL,
    season INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'rascunho',
    scoring_system_id UUID REFERENCES public.scoring_systems(id) ON DELETE SET NULL,
    max_rodadas INTEGER DEFAULT 38,
    created_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    start_date DATE,
    end_date DATE,
    logo_url TEXT,
    area_name TEXT,
    area_flag TEXT,
    formato TEXT DEFAULT 'liga',
    detalhes_premiacao TEXT,
    apelido_grupo TEXT NOT NULL,
    fuso_horario TEXT NOT NULL DEFAULT 'America/Sao_Paulo'
);
COMMENT ON TABLE public.campeonatos IS 'Campeonatos cadastrados no sistema com fuso horário de referência.';

-- 2.5 Acessos aos Campeonatos (Adesão de usuários aos bolões)
CREATE TABLE IF NOT EXISTS public.campeonato_acessos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campeonato_id UUID REFERENCES public.campeonatos(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    time_id UUID REFERENCES public.times(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.campeonato_acessos IS 'Lista de e-mails autorizados em cada campeonato e time torcedor naquele campeonato.';

-- 2.6 Rodadas
CREATE TABLE IF NOT EXISTS public.rodadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_rodada INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'aguardando_escolha' CONSTRAINT rodadas_status_check CHECK (status IN ('aguardando_escolha', 'aberta', 'fechada', 'finalizada')),
    organizer_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    organizer_deadline TIMESTAMPTZ,
    betting_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    required_extra_games INTEGER NOT NULL DEFAULT 2,
    campeonato_id UUID NOT NULL REFERENCES public.campeonatos(id) ON DELETE CASCADE,
    fase TEXT DEFAULT 'grupos',
    multiplicador NUMERIC(3,1) DEFAULT 1.0,
    calendario_alterado BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE public.rodadas IS 'Rodadas associadas a um campeonato com controle de organizador em rodízio.';

-- 2.7 Partidas
CREATE TABLE IF NOT EXISTS public.partidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_match_id INTEGER NOT NULL,
    rodada_id UUID NOT NULL REFERENCES public.rodadas(id) ON DELETE CASCADE,
    time_casa TEXT NOT NULL,
    time_fora TEXT NOT NULL,
    api_team_home_id INTEGER,
    api_team_away_id INTEGER,
    gols_casa INTEGER,
    gols_fora INTEGER,
    status TEXT NOT NULL DEFAULT 'agendado' CONSTRAINT partidas_status_check CHECK (status IN ('agendado', 'finalizado', 'adiado')),
    data_partida TIMESTAMPTZ NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    is_extra BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    grupo TEXT
);
COMMENT ON TABLE public.partidas IS 'Partidas sincronizadas da API associadas a uma rodada.';

-- 2.8 Palpites comuns
CREATE TABLE IF NOT EXISTS public.palpites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    partida_id UUID NOT NULL REFERENCES public.partidas(id) ON DELETE CASCADE,
    gols_casa_bet INTEGER NOT NULL,
    gols_fora_bet INTEGER NOT NULL,
    pontos INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.palpites IS 'Palpites individuais dos usuários para cada partida.';

-- 2.9 Palpites especiais (Campeão, artilheiro, etc.)
CREATE TABLE IF NOT EXISTS public.palpites_especiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    campeonato_id UUID NOT NULL REFERENCES public.campeonatos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    valor TEXT NOT NULL,
    api_team_id INTEGER,
    pontos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.palpites_especiais IS 'Palpites especiais de longo prazo para campeonatos no formato Copa.';

-- 2.10 Solicitações de Acesso ao Sistema
CREATE TABLE IF NOT EXISTS public.solicitacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL DEFAULT 'acesso_sistema',
    status TEXT NOT NULL DEFAULT 'pendente',
    email TEXT NOT NULL,
    nome TEXT,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    telefone TEXT,
    cidade TEXT,
    mensagem TEXT,
    campeonato_id UUID REFERENCES public.campeonatos(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    motivo_rejeicao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    estado VARCHAR(255)
);
COMMENT ON TABLE public.solicitacoes IS 'Fluxo de solicitação e aprovação de novos participantes.';

-- 2.11 Pré-cadastro e autorizações de e-mail
CREATE TABLE IF NOT EXISTS public.email_autorizados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    nome_ref TEXT,
    autorizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.email_autorizados IS 'Lista de e-mails pré-autorizados a se cadastrar pelo administrador.';

-- 2.12 Logs de execuções automatizadas (Cron/Edge Functions)
CREATE TABLE IF NOT EXISTS public.cron_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    content TEXT NOT NULL
);
COMMENT ON TABLE public.cron_logs IS 'Registro de logs de automações do sistema.';


-- ============================================================
-- SEÇÃO 3: INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON public.solicitacoes USING btree (status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_email ON public.solicitacoes USING btree (email);
CREATE UNIQUE INDEX IF NOT EXISTS campeonatos_nome_apelido_unique ON public.campeonatos USING btree (nome, apelido_grupo);
CREATE INDEX IF NOT EXISTS idx_rodadas_status ON public.rodadas USING btree (status);
CREATE INDEX IF NOT EXISTS idx_rodadas_campeonato ON public.rodadas USING btree (campeonato_id);
CREATE INDEX IF NOT EXISTS idx_partidas_rodada_id ON public.partidas USING btree (rodada_id);
CREATE UNIQUE INDEX IF NOT EXISTS partidas_api_match_rodada_unique ON public.partidas USING btree (api_match_id, rodada_id);
CREATE INDEX IF NOT EXISTS idx_partidas_api_match_id ON public.partidas USING btree (api_match_id);
CREATE UNIQUE INDEX IF NOT EXISTS palpites_unique_bet ON public.palpites USING btree (usuario_id, partida_id);
CREATE INDEX IF NOT EXISTS idx_palpites_usuario_id ON public.palpites USING btree (usuario_id);
CREATE INDEX IF NOT EXISTS idx_palpites_partida_id ON public.palpites USING btree (partida_id);
CREATE UNIQUE INDEX IF NOT EXISTS campeonato_acessos_campeonato_id_email_key ON public.campeonato_acessos USING btree (campeonato_id, email);
CREATE INDEX IF NOT EXISTS idx_campeonato_acessos_email ON public.campeonato_acessos USING btree (email);
CREATE INDEX IF NOT EXISTS idx_campeonato_acessos_campeonato_id ON public.campeonato_acessos USING btree (campeonato_id);
CREATE UNIQUE INDEX IF NOT EXISTS palpites_especiais_usuario_id_campeonato_id_tipo_key ON public.palpites_especiais USING btree (usuario_id, campeonato_id, tipo);


-- ============================================================
-- SEÇÃO 4: ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_acessos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rodadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palpites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palpites_especiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_autorizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_logs ENABLE ROW LEVEL SECURITY;

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

-- ---- scoring_systems ----
CREATE POLICY "Todos podem ler scoring_systems" ON public.scoring_systems
    FOR SELECT USING (true);

CREATE POLICY "Admins gerenciam scoring_systems" ON public.scoring_systems
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    );

-- ---- campeonatos ----
CREATE POLICY "Todos podem ler campeonatos" ON public.campeonatos
    FOR SELECT USING (true);

CREATE POLICY "Admins gerenciam campeonatos" ON public.campeonatos
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    );

-- ---- campeonato_acessos ----
CREATE POLICY "Public read acessos" ON public.campeonato_acessos
    FOR SELECT USING (true);

CREATE POLICY "Admins read all" ON public.campeonato_acessos
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins insert" ON public.campeonato_acessos
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins update" ON public.campeonato_acessos
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins delete" ON public.campeonato_acessos
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admin full access campeonato_acessos" ON public.campeonato_acessos
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    );

-- ---- rodadas ----
CREATE POLICY "rodadas_leitura_publica" ON public.rodadas
    FOR SELECT USING (true);

-- ---- partidas ----
CREATE POLICY "partidas_leitura_publica" ON public.partidas
    FOR SELECT USING (true);

-- ---- palpites ----
CREATE POLICY "palpites_select" ON public.palpites
    FOR SELECT USING (
        auth.uid() = usuario_id
        OR EXISTS (
            SELECT 1
            FROM public.rodadas r
            JOIN public.partidas p ON p.rodada_id = r.id
            WHERE p.id = palpites.partida_id
              AND r.status = ANY (ARRAY['fechada'::text, 'finalizada'::text])
        )
    );

CREATE POLICY "palpites_insert" ON public.palpites
    FOR INSERT WITH CHECK (
        auth.uid() = usuario_id
        AND EXISTS (
            SELECT 1
            FROM public.rodadas r
            JOIN public.partidas p ON p.rodada_id = r.id
            WHERE p.id = palpites.partida_id
              AND r.status = 'aberta'::text
        )
    );

CREATE POLICY "palpites_update_proprio" ON public.palpites
    FOR UPDATE USING (
        auth.uid() = usuario_id
        AND EXISTS (
            SELECT 1
            FROM public.rodadas r
            JOIN public.partidas p ON p.rodada_id = r.id
            WHERE p.id = palpites.partida_id
              AND r.status = 'aberta'::text
        )
    );

CREATE POLICY "palpites_admin_select_all" ON public.palpites
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    );

-- ---- palpites_especiais ----
CREATE POLICY "palpites_especiais_select_proprio" ON public.palpites_especiais
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "palpites_especiais_insert_proprio" ON public.palpites_especiais
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "palpites_especiais_update_proprio" ON public.palpites_especiais
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "palpites_especiais_select_public" ON public.palpites_especiais
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.campeonatos c 
            WHERE c.id = palpites_especiais.campeonato_id 
              AND c.status = 'finalizado'::text
        )
    );

-- ---- solicitacoes ----
CREATE POLICY "solicitacoes_select_own" ON public.solicitacoes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "solicitacoes_insert_own" ON public.solicitacoes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "solicitacoes_admin_all" ON public.solicitacoes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    );

-- ---- email_autorizados ----
CREATE POLICY "email_autorizados_admin_all" ON public.email_autorizados
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    );

-- ---- cron_logs ----
CREATE POLICY "cron_logs_admin_leitura" ON public.cron_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true)
    );


-- ============================================================
-- SEÇÃO 5: FUNCTIONS & TRIGGERS
-- ============================================================

-- 5.1 Trigger de sincronização de nomes customizados de times
CREATE OR REPLACE FUNCTION public.trg_fill_custom_team_names()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_nome_casa TEXT;
  v_nome_fora TEXT;
BEGIN
  IF NEW.api_team_home_id IS NOT NULL THEN
    SELECT nome INTO v_nome_casa FROM public.times WHERE api_team_id = NEW.api_team_home_id;
    IF v_nome_casa IS NOT NULL THEN
      NEW.time_casa := v_nome_casa;
    END IF;
  END IF;

  IF NEW.api_team_away_id IS NOT NULL THEN
    SELECT nome INTO v_nome_fora FROM public.times WHERE api_team_id = NEW.api_team_away_id;
    IF v_nome_fora IS NOT NULL THEN
      NEW.time_fora := v_nome_fora;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_before_partidas_save ON public.partidas;
CREATE TRIGGER trg_before_partidas_save
    BEFORE INSERT OR UPDATE ON public.partidas
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_fill_custom_team_names();


-- 5.2 Algoritmo de determinação dinâmica de organizador por rodízio
CREATE OR REPLACE FUNCTION public.get_organizer_for_round(p_numero_rodada integer, p_campeonato_id uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INT;
  v_id    UUID;
BEGIN
  IF p_campeonato_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_total
    FROM public.campeonato_acessos ca
    JOIN public.usuarios u ON u.email = ca.email
    WHERE ca.campeonato_id = p_campeonato_id
      AND u.is_admin = false;

    IF v_total = 0 THEN
      RETURN NULL;
    END IF;

    SELECT u.id INTO v_id
    FROM public.campeonato_acessos ca
    JOIN public.usuarios u ON u.email = ca.email
    LEFT JOIN (
      SELECT r.organizer_id, COUNT(*) as round_count, MAX(r.numero_rodada) as last_round
      FROM public.rodadas r
      WHERE r.campeonato_id = p_campeonato_id
      GROUP BY r.organizer_id
    ) stats ON stats.organizer_id = u.id
    WHERE ca.campeonato_id = p_campeonato_id
      AND u.is_admin = false
    ORDER BY 
      COALESCE(stats.round_count, 0) ASC,
      COALESCE(stats.last_round, 0) ASC,
      u.nome ASC
    LIMIT 1;

  ELSE
    SELECT COUNT(*) INTO v_total FROM public.usuarios WHERE is_admin = false;
    IF v_total = 0 THEN
      RETURN NULL;
    END IF;

    SELECT u.id INTO v_id
    FROM public.usuarios u
    LEFT JOIN (
      SELECT r.organizer_id, COUNT(*) as round_count, MAX(r.numero_rodada) as last_round
      FROM public.rodadas r
      GROUP BY r.organizer_id
    ) stats ON stats.organizer_id = u.id
    WHERE u.is_admin = false
    ORDER BY 
      COALESCE(stats.round_count, 0) ASC,
      COALESCE(stats.last_round, 0) ASC,
      u.nome ASC
    LIMIT 1;
  END IF;

  RETURN v_id;
END;
$$;


-- 5.3 Redistribuição automática de organizadores futuros
CREATE OR REPLACE FUNCTION public.redistribute_organizers(p_campeonato_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_round RECORD;
  v_new_org UUID;
BEGIN
  FOR v_round IN 
    SELECT id, numero_rodada, organizer_id 
    FROM public.rodadas 
    WHERE campeonato_id = p_campeonato_id 
      AND (status = 'aguardando_escolha' OR organizer_id IS NULL)
    ORDER BY numero_rodada ASC
  LOOP
    v_new_org := public.get_organizer_for_round(v_round.numero_rodada, p_campeonato_id);
    
    IF (v_new_org IS NULL AND v_round.organizer_id IS NOT NULL) OR 
       (v_new_org IS NOT NULL AND (v_round.organizer_id IS NULL OR v_round.organizer_id != v_new_org)) THEN
      UPDATE public.rodadas 
      SET organizer_id = v_new_org 
      WHERE id = v_round.id;
    END IF;
  END LOOP;
END;
$$;


-- 5.4 Trigger de disparo da redistribuição ao alterar acessos
CREATE OR REPLACE FUNCTION public.trg_on_campeonato_acessos_changed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.redistribute_organizers(OLD.campeonato_id);
  ELSE
    PERFORM public.redistribute_organizers(NEW.campeonato_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_campeonato_acessos_changed ON public.campeonato_acessos;
CREATE TRIGGER trg_campeonato_acessos_changed
    AFTER INSERT OR DELETE OR UPDATE ON public.campeonato_acessos
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_on_campeonato_acessos_changed();


-- 5.5 Trigger de cálculo e atribuição automática de pontos baseada nas regras do campeonato
CREATE OR REPLACE FUNCTION public.calcular_pontos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_regras JSONB;
BEGIN
  IF NEW.status NOT IN ('finalizado', 'adiado') THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'finalizado' AND (NEW.gols_casa IS NULL OR NEW.gols_fora IS NULL) THEN
    RAISE WARNING 'calcular_pontos: partida % marcada como finalizado mas gols são NULL. Pontuação não processada.', NEW.id;
    RETURN NEW;
  END IF;

  SELECT ss.regras INTO v_regras
  FROM rodadas r
  JOIN campeonatos c ON c.id = r.campeonato_id
  JOIN scoring_systems ss ON ss.id = c.scoring_system_id
  WHERE r.id = NEW.rodada_id;

  IF v_regras IS NULL THEN
    v_regras := '{"placar_exato": 3, "vencedor_correto": 1, "errou": 0}'::jsonb;
  END IF;

  UPDATE public.palpites p
  SET pontos = CASE
    WHEN NEW.status = 'adiado'
      THEN 0
    WHEN p.gols_casa_bet = NEW.gols_casa
     AND p.gols_fora_bet = NEW.gols_fora
      THEN COALESCE((v_regras->>'placar_exato')::int, 3)
    WHEN SIGN(p.gols_casa_bet - p.gols_fora_bet) = SIGN(NEW.gols_casa - NEW.gols_fora)
      THEN COALESCE((v_regras->>'vencedor_correto')::int, 1)
    ELSE COALESCE((v_regras->>'errou')::int, 0)
  END
  WHERE p.partida_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calcular_pontos ON public.partidas;
CREATE TRIGGER trg_calcular_pontos
    AFTER UPDATE OF gols_casa, gols_fora, status ON public.partidas
    FOR EACH ROW
    EXECUTE FUNCTION public.calcular_pontos();


-- 5.6 Criação automática de perfil público após registro no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- SEÇÃO 6: PERMISSÕES (GRANTS) PARA API DE DADOS (SUPABASE)
-- ============================================================

-- Permissões para a Role 'anon' (Leitura pública onde RLS permitir)
GRANT SELECT ON public.times TO anon;
GRANT SELECT ON public.usuarios TO anon;
GRANT SELECT ON public.rodadas TO anon;
GRANT SELECT ON public.partidas TO anon;
GRANT SELECT ON public.palpites TO anon;
GRANT SELECT ON public.campeonatos TO anon;
GRANT SELECT ON public.scoring_systems TO anon;

-- Permissões para a Role 'authenticated' (CRUD sob regras do RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.times TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rodadas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partidas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.palpites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.palpites_especiais TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_autorizados TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campeonatos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campeonato_acessos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scoring_systems TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacoes TO authenticated;
GRANT SELECT ON public.cron_logs TO authenticated;

-- Permissões para a Role 'service_role' (Acesso total para backend)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;


-- ============================================================
-- HISTÓRICO DE MIGRAÇÕES & ATUALIZAÇÕES
-- ============================================================
-- [2026-07-22] - Consolidação e Reestruturação Completa do Banco
-- Motivo: Preparação para clonagem do banco para novo ambiente (+BET Novo).
-- Alterações:
--   - Integração das tabelas de campeonatos, campeonato_acessos, scoring_systems e solicitacoes.
--   - Atualização da tabela de usuarios com novos campos (cidade, estado, telefone, status).
--   - Remoção de colunas legadas e consolidação das novas funções e triggers de cálculo de pontos, organizador de rodadas e sincronização de nomes dos times.
--   - Ajuste das políticas de RLS e permissões (Grants) de forma abrangente.
