-- 1. Função de trigger para preencher/atualizar time_casa e time_fora com os nomes da tabela times
CREATE OR REPLACE FUNCTION public.trg_fill_custom_team_names()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_nome_casa TEXT;
  v_nome_fora TEXT;
BEGIN
  -- Busca nome customizado do time de casa
  IF NEW.api_team_home_id IS NOT NULL THEN
    SELECT nome INTO v_nome_casa FROM public.times WHERE api_team_id = NEW.api_team_home_id;
    IF v_nome_casa IS NOT NULL THEN
      NEW.time_casa := v_nome_casa;
    END IF;
  END IF;

  -- Busca nome customizado do time de fora
  IF NEW.api_team_away_id IS NOT NULL THEN
    SELECT nome INTO v_nome_fora FROM public.times WHERE api_team_id = NEW.api_team_away_id;
    IF v_nome_fora IS NOT NULL THEN
      NEW.time_fora := v_nome_fora;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Criação do Trigger BEFORE INSERT OR UPDATE na tabela partidas
DROP TRIGGER IF EXISTS trg_before_partidas_save ON public.partidas;

CREATE TRIGGER trg_before_partidas_save
  BEFORE INSERT OR UPDATE ON public.partidas
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fill_custom_team_names();

-- 3. Atualizar todas as partidas existentes para forçar a execução do trigger e corrigir os nomes atuais
UPDATE public.partidas
SET time_casa = time_casa;
