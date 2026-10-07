-- 1. Colunas de auditoria na tabela rodadas
ALTER TABLE public.rodadas
  ADD COLUMN IF NOT EXISTS extras_escolhidos_tipo TEXT,
  ADD COLUMN IF NOT EXISTS extras_escolhidos_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS extras_escolhidos_em TIMESTAMPTZ;

-- 2. Atualizar RLS de palpites para impedir que admins gravem palpites para si próprios
-- Obs: Admins podem ler via RLS ou service role. Lançamentos em nome de jogadores são feitos via backend (service role).

DROP POLICY IF EXISTS "palpites_insert" ON public.palpites;
CREATE POLICY "palpites_insert" ON public.palpites
  FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
    AND NOT EXISTS (
      SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true
    )
    AND EXISTS (
      SELECT 1
      FROM public.rodadas r
      JOIN public.partidas p ON p.rodada_id = r.id
      WHERE p.id = palpites.partida_id
        AND r.status = 'aberta'::text
    )
  );

DROP POLICY IF EXISTS "palpites_update_proprio" ON public.palpites;
CREATE POLICY "palpites_update_proprio" ON public.palpites
  FOR UPDATE USING (
    auth.uid() = usuario_id
    AND NOT EXISTS (
      SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true
    )
    AND EXISTS (
      SELECT 1
      FROM public.rodadas r
      JOIN public.partidas p ON p.rodada_id = r.id
      WHERE p.id = palpites.partida_id
        AND r.status = 'aberta'::text
    )
  );

DROP POLICY IF EXISTS "palpites_especiais_insert_proprio" ON public.palpites_especiais;
CREATE POLICY "palpites_especiais_insert_proprio" ON public.palpites_especiais
  FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
    AND NOT EXISTS (
      SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "palpites_especiais_update_proprio" ON public.palpites_especiais;
CREATE POLICY "palpites_especiais_update_proprio" ON public.palpites_especiais
  FOR UPDATE USING (
    auth.uid() = usuario_id
    AND NOT EXISTS (
      SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND is_admin = true
    )
  );
