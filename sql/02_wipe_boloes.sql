-- Script seguro para zerar todos os bolões e palpites (Clean Slate)
-- Mantém a tabela de 'usuarios' (seu login admin intacto) e 'times' (seu dicionário de escudos intacto)

TRUNCATE TABLE public.campeonatos CASCADE;

-- O comando CASCADE diz ao banco: 
-- "Apague também todas as rodadas, partidas, palpites e acessos que dependiam dos campeonatos apagados".
-- Após rodar isso, seu Lobby ficará 100% zerado e pronto para você criar os campeonatos oficiais limpos!
