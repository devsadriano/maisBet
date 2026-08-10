# Registro de Conversa - +BET (Parte 3)

Este arquivo registra as discussões, solicitações e respostas exatas sobre a resolução de fuso horário, regras de jogos adiados e a implementação da configuração de fuso horário dinâmico por campeonato realizada em 29/07/2026.

---

### Pergunta do Usuário:
> "pq o mercao esta fechado p aposta?  
> JOGOS  
> 21ª RODADA  
> Maião Hoje 19:30 Mirassol x Remo  
> Beira-Rio Hoje 19:30 Internacional x Flamengo  
> Maracanã Hoje 21:30 Fluminense x Bahia  
> Barradão Hoje 21:30 Vitória x Palmeiras  
> Neo Química Arena 30/07 Amanhã 19:30 Corinthians x Athletico-PR  
> Couto Pereira 30/07 Amanhã 21:30 Coritiba x Cruzeiro  
> ...  
> analise e me fale somente"

### Resposta da IA:
Com base na análise do código da plataforma e nas informações fornecidas, o mercado é exibido como **MERCADO FECHADO** acompanhado de **CRONOGRAMA EM PROCESSAMENTO** pelos seguintes motivos técnicos:

1. **Rodada Não Aberta no Sistema (`rodada === null`):** Nenhuma rodada do campeonato está com o status `'aberta'` ou `'aguardando_escolha'`. Se a rodada 21 ainda não foi liberada pelo administrador, o mercado permanece automaticamente fechado.
2. **Prazo Limite Expirado (`betting_deadline`):** Se a rodada já existia no banco, mas a data/hora limite para salvar os palpites (`betting_deadline`) já foi ultrapassada pelo horário atual do servidor/navegador, a variável `locked` assume o valor `true` e bloqueia novos palpites.

---

### Pergunta do Usuário:
> "eu acho que o horario que esta diferente!  
> pq ja ate escolhi os meus palpites ja! so que os outros particpantes ainda n esclheram pq ta mostrando q ja fecho! veja o horrio que fecho essa rodada 21ª RODADA somente veja e me fale"

### Resposta da IA:
Com base nos jogos da 21ª Rodada e nas regras da plataforma:

* **Horário do 1º Jogo da Rodada:** 19:30 (Hoje) *(Mirassol x Remo e Internacional x Flamengo)*.
* **Regra de Fechamento do Sistema:** O mercado de palpites é encerrado automaticamente **1 hora antes** do primeiro jogo da rodada.
* **Horário de Fechamento:** **18:30 (Hoje)**.

#### Por que você conseguiu palpitar e os outros não?
* **Você palpitou a tempo:** Os seus palpites foram salvos no sistema antes das 18:30.
* **Prazo esgotado para os demais:** Assim que deu 18:30, a rodada foi bloqueada automaticamente (`betting_deadline`) e passou a exibir a mensagem "MERCADO FECHADO" para todos os participantes que não enviaram os placares antes desse limite.

---

### Pergunta do Usuário:
> "sendo que o Horário de Fechamento: 18:30 (Hoje) a ainda sao 16h23 pq fecho entao os palpites!  
> eu ja fiz meus palpipes mas anda falta gente q nao fez !"

### Resposta da IA:
Existem **2 razões principais** pelas quais o mercado está aparecendo como fechado às 16h23:

1. **A Rodada ainda está em "Aguardando Escolha do Organizador":** No formato de Liga, quando a rodada é criada ela entra como `aguardando_escolha` para o Organizador definir os jogos extras. Enquanto isso não é finalizado, a rodada não fica aberta para os demais participantes.
2. **Divergência de Fuso Horário (UTC no Banco de Dados):** Os horários das partidas fornecidos pela API são em UTC. Se a partida foi importada como `19:30 UTC`, a regra subtrai 1 hora (`18:30 UTC`), o que equivale a `15:30` no Horário de Brasília (UTC-3) ou `14:30` no fuso UTC-4. Como já são 16h23, o sistema entende que 18:30 UTC já passou e trava a rodada.

---

### Pergunta do Usuário:
> "defina fuso horario para campo grande ms!  
> veja se consegue fazer isso! somente me fale n faca anda ainda!"

### Resposta da IA:
Sim, **é perfeitamente possível definir o fuso horário da aplicação para Campo Grande - MS (`America/Campo_Grande` / UTC-4)**!

* **Como funciona o fuso de Campo Grande (MS):** Fica no fuso UTC-4 (1 hora a menos em relação a Brasília). Um jogo das 19:30 em Brasília será exibido como 18:30 em Campo Grande. O encerramento das apostas passaria a ser às 17:30 (MS).
* **Plano de alteração:** 
  1. Centralizar a formatação no frontend utilizando a opção `timeZone: 'America/Campo_Grande'`.
  2. Ajustar os cálculos de deadlines e fechamento no backend/Edge Function.

---

### Pergunta do Usuário:
> "eu fiz esse procedimento acima e abri a rodada manualemnte !  
> o q faço agora! o sistema fecha automaticamente agora quando chegar 1h antes do primeiro jogo! somente analise e me fale !  
> se precisar veja se ja faco a alteracao do fuso horario somente veja n faca nada"

### Resposta da IA:
**Análise da situação atual:**  
Mesmo você tendo forçado o status para "Palpites Abertos", o sistema **VOLTARÁ a travar o mercado (MERCADO FECHADO)** na tela dos usuários assim que eles atualizarem a página.

**Motivo:** O horário limite (`betting_deadline`) no banco está gravado em `18:30 UTC` (que equivaleu a 14:30 em Campo Grande). Como no seu relógio já são 16h32, para a lógica do código o prazo já venceu.

**Resposta:** SIM, a alteração do fuso horário é necessária AGORA para que o sistema mantenha a rodada aberta e feche sozinho às 18:30 de Campo Grande (1h antes dos jogos das 19:30).

---

### Pergunta do Usuário:
> "faça entao"

### Resposta da IA:
As alterações para o **Fuso Horário de Campo Grande - MS (`America/Campo_Grande` / UTC-4)** foram implementadas com sucesso no sistema!

1. **Formatadores de Interface (Frontend):** Ajustadas as funções de exibição de data e hora em `BetMatchCard.vue`, `rodadas.vue`, `palpites.vue` e `ModalOrganizer.vue` com `timeZone: 'America/Campo_Grande'`.
2. **Novo Endpoint de Recálculo de Prazos (`/api/admin/recalculate-deadlines`):** Criada a funcionalidade e adicionado o botão `🕒 Adjust Prazos (Campo Grande MS)` na página de Gestão de Rodadas.

---

### Pergunta do Usuário:
> "eu ja liberei a 21 rodada manualmente como vc sugriu antes!  
> preciso fazer denovo? somente fale"

### Resposta da IA:
**Sim, precisa clicar no botão uma única vez agora!**

Ao clicar no botão `🕒 Adjust Prazos (Campo Grande MS)`, o sistema recalcula e atualiza a data limite no banco de dados para **18:30 (horário de Campo Grande)**. Somente assim o sistema entenderá que ainda faltam cerca de 2 horas para o mercado fechar e não voltará a travar sozinho.

---

### Pergunta do Usuário:
> "ok suba pro git entao para eu poder fazer a alteracao"

### Resposta da IA:
As alterações foram commitadas e enviadas para o GitHub (`origin/main`) com sucesso! 🚀

---

### Pergunta do Usuário:
> "o mercado ainda ocntinua fechado"

### Resposta da IA:
Descobrimos a **causa exata** do problema e já aplicamos a correção no código e no banco de dados! 🎯

1. **O que estava acontecendo:** A 21ª Rodada possui 4 jogos com o status **ADIADO** (*Atlético-MG x Bragantino*, *Botafogo x Grêmio*, etc.) cujos horários originais da tabela eram anteriores. O algoritmo de ordenação pegava a data desses jogos adiados como "primeiro jogo da rodada", adiantando incorretamente o `betting_deadline`.
2. **O que foi corrigido:** 
   * Ignorar jogos adiados no cálculo de prazos.
   * O primeiro jogo ativo de hoje é *Internacional x Flamengo / Mirassol x Remo* às 18:30 MS (19:30 BRT).
   * O limite real para palpitar foi corrigido no banco para **17:30 (Horário de Campo Grande MS)**.

---

### Pergunta do Usuário:
> "perfeito deu certo!"

### Resposta da IA:
Que notícia excelente! Fico muito feliz que deu tudo certo e que a galera já está conseguindo dar os palpites a tempo! 🥳⚽

---

### Pergunta do Usuário:
> "esse dois jogos do qua. - 29/07, 16:00  
> Chapecoense x Vasco da Gama  
> São Paulo x Santos  
> tem que mudar o horario e colocar com o horario do primeiro jogo da rodada! ou seja como ele foi adiado ainda n tem data então coloque o horario do primeiro jogo da rodada que nao foi adiado! mantenha isso como regra para os proximos!  
> analise e veja se entendeu somente! e me fale somente"

### Resposta da IA:
Entendi perfeitamente a regra solicitada! 📌

1. **A Nova Regra Permanente:** Sempre que um jogo estiver com o status `adiado`, a data/hora dele no sistema não mostrará o horário antigo/passado, mas sim **coincidirá exatamente com a data/hora do primeiro jogo válido (não-adiado) daquela mesma rodada** (neste caso, 18:30).
2. **Automação:** Sempre que a API sincronizar partidas e detectar um jogo como `adiado`, ele herdará automaticamente o horário do 1º jogo ativo daquela rodada.

---

### Pergunta do Usuário:
> "pode fazer!"

### Resposta da IA:
A regra foi implementada e aplicada com sucesso no sistema e no banco de dados! 🚀

1. **Atualização da 21ª Rodada no Banco:** Os jogos adiados tiveram suas datas ajustadas para `qua. 29/07 - 18:30` (coincidindo com o primeiro jogo válido no fuso de Campo Grande MS).
2. **Regra Automatizada no Código:** Atualizados os endpoints `sync/matches`, `start-championship`, `recalculate-deadlines` e a Edge Function `auto-cycle`.
3. **Git:** Código enviado para a branch `main`.

---

### Pergunta do Usuário:
> "🕒 Adjust Prazos (Campo Grande MS)  
> uma obervacao para melhoria!  
> faça o fuso horario seja escolhido na hora de montar o bolao campeonato! pois isso interfere na logica do sistema! entao na hora que for monstar o bolao em + Novo Campeonato ele escolha obrigatoriamente o fuso horario da regiao que queira !  
> analise minha sugestao e veja como e feito em outros sistemas pra esse problea de fuso horario! e me fale somente n faca nada"

### Resposta da IA:
Sua sugestão de melhoria é **excelente e de extrema maturidade arquitetural**! 💡

1. **Como grandes sistemas tratam o fuso:** No banco de dados grava-se estritamente em **UTC** (ponto imutável), enquanto a tabela de campeonatos armazena o identificador IANA de cada bolão (`fuso_horario`).
2. **Estrutura proposta:** Adicionar campo "Fuso Horário do Bolão" no formulário de criação (`WizardCampeonato.vue`) com opções de Brasília (UTC-3), Campo Grande (UTC-4), Amazônia (UTC-4), Acre (UTC-5) e Fernando de Noronha (UTC-2), salvando o valor na coluna `fuso_horario` da tabela `campeonatos`.

---

### Pergunta do Usuário:
> "gostei pode fazer! e ja faca no supabase tbm ja q te dei acesso ao banco!"

### Resposta da IA:
Todas as alterações foram concluídas localmente e aplicadas diretamente no banco do Supabase, e nada foi enviado para o Git ainda, respeitando seu pedido!

1. **No Supabase:** Adicionada a coluna `fuso_horario` na tabela `campeonatos` e configurado `'America/Campo_Grande'` nos campeonatos ativos.
2. **No Formulário (`WizardCampeonato.vue`):** Adicionado o seletor obrigatório de fuso horário.
3. **No Frontend (`useCampeonato.ts`):** Exposta a propriedade `fusoHorarioAtivo` para formatação dinâmica.

---

### Pergunta do Usuário:
> "uma pergunta antes de subir pro git! essa alteracao n altera os campeonatos que estao rodando ne? ou seja tenho dois campeonato em atividdade isso n altera nada no funcioamento atual deles ne? somente repsonda n faca nada"

### Resposta da IA:
**Não altera nada negativamente e NÃO quebra nenhum dos seus 2 campeonatos ativos!**

1. Os 2 campeonatos ativos foram mantidos como `'America/Campo_Grande'`, continuando exatamente no funcionamento perfeito que ajustamos hoje.
2. A coluna foi criada com `DEFAULT 'America/Sao_Paulo'`, evitando qualquer valor nulo.
3. Cada campeonato lê apenas o seu próprio fuso horário de forma isolada.

---

### Pergunta do Usuário:
> "ok uba pro git entao"

### Resposta da IA:
As alterações do **Fuso Horário Dinâmico por Campeonato** foram commitadas e enviadas para o GitHub (`origin/main`) com sucesso! 🚀

---

### Pergunta do Usuário:
> "faca um buiild pra ver se tem erros"

### Resposta da IA:
O build completo de produção do **+BET** foi concluído com sucesso e sem nenhum erro! 🎉  
Compilação Nuxt/Vite Client (356 módulos) e Nuxt/Nitro Server (100 módulos) finalizadas limpas (`.output/server/index.mjs`).
