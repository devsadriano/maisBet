-- 1. Alterar organizer_id na tabela rodadas para permitir valores nulos (nullable)
ALTER TABLE public.rodadas ALTER COLUMN organizer_id DROP NOT NULL;

-- 2. Atualizar a função get_organizer_for_round com a lógica dinâmica baseada no histórico de rodadas organizadas
CREATE OR REPLACE FUNCTION public.get_organizer_for_round(p_numero_rodada INT, p_campeonato_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INT;
  v_id    UUID;
BEGIN
  IF p_campeonato_id IS NOT NULL THEN
    -- Conta participantes não-admin cadastrados no campeonato específico
    SELECT COUNT(*) INTO v_total
    FROM public.campeonato_acessos ca
    JOIN public.usuarios u ON u.email = ca.email
    WHERE ca.campeonato_id = p_campeonato_id
      AND u.is_admin = false;

    -- Se não houver participantes, retorna NULL para que a rodada fique com organizador indefinido
    IF v_total = 0 THEN
      RETURN NULL;
    END IF;

    -- Seleciona o participante que organizou o MENOR número de rodadas neste campeonato.
    -- Desempate 1: organizou há mais tempo (menor last_round).
    -- Desempate 2: ordem alfabética.
    SELECT u.id INTO v_id
    FROM public.campeonato_acessos ca
    JOIN public.usuarios u ON u.email = ca.email
    LEFT JOIN (
      -- Contagem de rodadas organizadas
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
    -- Legado (caso campeonato_id não seja informado)
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

-- 3. Função de Redistribuição de Organizadores para rodadas em 'aguardando_escolha' ou nulas
CREATE OR REPLACE FUNCTION public.redistribute_organizers(p_campeonato_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_round RECORD;
  v_new_org UUID;
BEGIN
  -- Percorre rodadas futuras/em aguardando escolha daquele campeonato
  FOR v_round IN 
    SELECT id, numero_rodada, organizer_id 
    FROM public.rodadas 
    WHERE campeonato_id = p_campeonato_id 
      AND (status = 'aguardando_escolha' OR organizer_id IS NULL)
    ORDER BY numero_rodada ASC
  LOOP
    -- Calcula o organizador ideal
    v_new_org := public.get_organizer_for_round(v_round.numero_rodada, p_campeonato_id);
    
    -- Atualiza caso o organizador atual seja nulo, tenha mudado, ou o novo seja nulo (limpa fallbacks antigos)
    IF (v_new_org IS NULL AND v_round.organizer_id IS NOT NULL) OR 
       (v_new_org IS NOT NULL AND (v_round.organizer_id IS NULL OR v_round.organizer_id != v_new_org)) THEN
      UPDATE public.rodadas 
      SET organizer_id = v_new_org 
      WHERE id = v_round.id;
    END IF;
  END LOOP;
END;
$$;

-- 4. Função e trigger para automatizar a redistribuição quando campeonato_acessos muda
CREATE OR REPLACE FUNCTION public.trg_on_campeonato_acessos_changed()
RETURNS TRIGGER
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
  AFTER INSERT OR UPDATE OR DELETE ON public.campeonato_acessos
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_on_campeonato_acessos_changed();
