-- 1. Cria a coluna na tabela de acessos referenciando a tabela times
ALTER TABLE public.campeonato_acessos 
ADD COLUMN IF NOT EXISTS time_id uuid REFERENCES public.times(id) ON DELETE SET NULL;

-- 2. Migração Cirúrgica dos Dados (Sem perder nenhum time já marcado!)
UPDATE public.campeonato_acessos ca
SET time_id = u.time_id
FROM public.usuarios u
WHERE u.email = ca.email
  AND ca.time_id IS NULL;

-- 3. A View de Ranking legada puxava o time_id antigo, vamos excluí-la já que não é usada pelo Frontend
DROP VIEW IF EXISTS public.vw_ranking;

-- 4. Agora podemos remover seguramente a coluna obsoleta da tabela usuários
ALTER TABLE public.usuarios
DROP COLUMN IF EXISTS time_id;
