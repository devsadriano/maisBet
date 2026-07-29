# Registro de Conversa - +BET / maisbetsaas (Parte 2)

Este arquivo registra as discussões, decisões arquiteturais e ações realizadas em 22/07/2026 sobre a consolidação do banco de dados Supabase e a duplicação do projeto para início do novo ambiente (`maisbetsaas`).

---

### Pergunta do Usuário:
> "nesse projeto tenho mcp configurado e ativo do spabase?"

### Resposta da IA:
Atualmente, **não** há um MCP (Model Context Protocol) do Supabase configurado ou ativo para o assistente de IA. No entanto, o projeto possui o Supabase configurado localmente via:
* Arquivo `.env` (com chaves de URL, Key, Secret Key e Database URL).
* Dependências `@nuxtjs/supabase` e `@supabase/supabase-js`.
* Pasta `supabase` na raiz.

---

### Solicitação do Usuário:
> "preciso criar um novo projeto deixando esse com pequenos ajustes pontuais porque ja esta em producao! e quero criar um novo repositrio no git e subir esse projeto com outro nome pra la e tbm quero fazer um novo supabase e conecat com esse projeto novo! dito isso como faço pra clonar o supabase? preciso fazer um mcp pra isso se for o recomendado eu faco! e depois quais sao os passo que tenho que fazer para clonar o supabase"

### Resposta da IA:
Explicado que **não é recomendado criar um MCP** para clonagem, pois adicionaria complexidade desnecessária para uma tarefa pontual. O caminho oficial recomendado é:
1. Criar o novo projeto no painel do Supabase.
2. Usar a CLI do Supabase para gerar o backup (dump) de estrutura e dados do banco antigo.
3. Importar os dumps (`roles.sql`, `schema.sql`, `data.sql`) no novo banco via `psql`.
4. Duplicar o repositório Git localmente e apontar para a nova URL de repositório remoto.
5. Atualizar as chaves de ambiente no `.env` do novo projeto.

---

### Diretrizes de Arquitetura de Banco de Dados Definidas pelo Usuário:
O usuário estabeleceu a seguinte **Regra de Ouro Inquebrável**:
* O arquivo `schema.sql` é a **FONTE ÚNICA DE VERDADE** da aplicação.
* Fluxo obrigatório de alteração de banco:
  1. Aplicar a mudança no banco de dados real.
  2. Atualizar os tipos de dados do frontend (interfaces TS no Nuxt).
  3. Atualizar imediatamente o arquivo `schema.sql` (gerando o script capaz de reconstruir tudo do zero).
* O arquivo deve conter: Tipos Customizados/Enums, Tabelas/Colunas, Chaves/FKs/Relacionamentos, RLS habilitado e políticas completas, Funções, Gatilhos (Triggers), Índices e Views.
* Manter um bloco de comentário no final do arquivo focado em **Histórico de Migrações**, contendo data, motivo e comando SQL exato da alteração.

---

### Ações Executadas:

#### 1. Consolidação e Geração do `schema.sql`
A IA instalou temporariamente o driver do PostgreSQL (`pg`) no projeto e rodou um script para extrair a estrutura real diretamente do banco de dados de produção do Supabase. Foi gerada uma versão limpa e completa em `supabase/schema.sql` contendo:
* **Tabelas e Constraints**: `times`, `usuarios` (com novos campos de cadastro), `scoring_systems`, `campeonatos`, `campeonato_acessos`, `rodadas`, `partidas`, `palpites`, `palpites_especiais`, `solicitacoes`, `email_autorizados` e `cron_logs`.
* **Políticas de RLS**: Todas as políticas de acesso aplicadas cirurgicamente nas 12 tabelas.
* **Triggers e Functions**: Gatilho de cálculo de pontos por campeonato, rotinas de rodízio de organizadores, sincronizador de nomes de times e trigger de signup automático.
* **Indexes**: Todos os 15 índices cadastrados no banco para otimização de queries.
* **Histórico de Migrações**: Bloco adicionado ao final do arquivo.

#### 2. Duplicação do Projeto (`maisbetsaas`)
A IA executou um script de cópia recursiva para duplicar o projeto de `c:\Antigravity\+BET` para `c:\Antigravity\maisbetsaas`, com as seguintes regras:
* **Exclusão de pastas pesadas**: `node_modules`, `.nuxt`, `.output`, `.git` e pastas temporárias foram ignoradas na cópia para garantir uma transferência limpa.
* Limpeza e remoção segura de todos os scripts temporários criados para a extração do schema.

---

### Próximos Passos Recomendados para o Usuário no Novo Projeto:
1. Abrir a pasta `c:\Antigravity\maisbetsaas` no Antigravity.
2. Executar `npm install` no terminal da nova pasta.
3. Inicializar o Git (`git init`, adicionar o remote do novo repositório e dar push).
4. Executar o script [schema.sql](file:///c:/Antigravity/+BET/supabase/schema.sql) no SQL Editor do painel do novo Supabase.
5. Atualizar o arquivo `.env` do novo projeto com as credenciais do banco novo.
