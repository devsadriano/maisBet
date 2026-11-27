# +BET — Regulamento Oficial (Campeonato / Liga)

Abaixo estão descritas as regras definitivas que regem os bolões no formato **Campeonato / Liga**:

## 1. Composição da Rodada (Quais jogos entram?)
- **Rodadas Normais (1ª à penúltima rodada):** não entram todos os jogos da rodada. Participam todos os **jogos obrigatórios** (partidas envolvendo o time do coração de qualquer participante inscrito no bolão) somados aos **jogos extras** escolhidos pelo Organizador da rodada.
- **Jogos Extras e Confronto Direto:** a quantidade de jogos extras segue a fórmula **`1 + número de confrontos diretos`** entre times de participantes naquela rodada:
  - Sem confronto direto: **1 jogo extra**
  - 1 confronto direto: **2 jogos extras**
  - 2 confrontos diretos: **3 jogos extras**
- **Regra da Última Rodada (`max_rodadas`, ex.: 38ª Rodada):** na última rodada do campeonato, **TODOS os jogos da rodada entram automaticamente como obrigatórios (`0` jogos extras)** e não há participação do Organizador — a rodada já abre diretamente para palpites.

## 2. Time do Coração
- Ao entrar no bolão, cada participante escolhe um clube do campeonato como seu **Time do Coração**.
- **Escolha definitiva:** após confirmada, a escolha **não pode ser alterada** durante o campeonato.
- Quem participa de múltiplos bolões escolhe um time independente por campeonato.
- O escudo aparece ao lado do nome do jogador no ranking e define as partidas obrigatórias em cada rodada.

## 3. Rodízio do Organizador de Rodadas e Transparência
Em cada rodada normal, um participante é escolhido automaticamente pelo sistema para ser o **Organizador** responsável por definir os jogos extras.
1. **Quem organizou menos vezes vai primeiro**;
2. **Em caso de empate**, vai quem organizou **há mais tempo**;
3. **Persistindo o empate**, **ordem alfabética** pelo nome.

> Ninguém organiza uma segunda vez antes que todos os demais tenham organizado ao menos uma. Novos participantes entram com `0` rodadas organizadas e têm prioridade automática na fila. Administradores não entram no rodízio.

- **Prazo do Organizador e Fallback Automático:** o organizador tem até **1 hora antes do 1º jogo válido da rodada** para escolher os extras. Se não escolher a tempo, o sistema seleciona automaticamente de forma aleatória (priorizando jogos `agendado`), abre a rodada e exibe o selo **`🤖 Escolha Automática`**.
- **Intervenção e Auditoria Pública:** em casos excepcionais, o Administrador pode assumir/reconfigurar os extras (`👑 Extras Definidos pelo Admin`) ou alterar o organizador. Toda a fila futura e o histórico completo ficam públicos em `/organizadores`.

## 4. Pontuação e Regras Gerais
- **Placar Cravado (3 pts padrão):** acertou exatamente os gols de casa e fora.
- **Resultado Correto (1 pt padrão):** acertou o vencedor ou empate sem acertar o placar exato (inclui empate com placar diferente).
- **Erro ou ausência de palpite (0 pts):** não há preenchimento automático.
- **Prazos e Fuso Horário:** mercado fecha **1 hora antes do 1º jogo válido**, no fuso horário configurado para o bolão, com trava individual por partida já iniciada.
- **Jogos Adiados / Calendário / 72h:** jogos `adiado` valem `0 pts` e são ignorados no prazo; mudanças da CBF recalculam prazos e geram alerta; caso uma rodada esteja `fechada` e o 1º jogo da próxima esteja a `<= 72h`, o sistema importa a próxima rodada antecipadamente.
- **Sigilo (RLS):** enquanto `aberta`, ninguém vê o palpite dos outros; ao fechar (`fechada` / `finalizada`), todos são revelados em **Ranking → Visão por Rodada**.
- **Desempate Oficial (Ranking Geral e da Rodada):** Pontos Total > Placares Cravados > Acertos Parciais > Ordem Alfabética.
- **Premiação:** definida exclusivamente pelo campo `detalhes_premiacao` de cada campeonato.
