# Registro de Conversa - +BET

Este arquivo registra as discussões e solicitações sobre o fluxo de autenticação e redefinição de senha realizadas em 13/07/2026.

---

### Solicitação do Usuário:
> "como esta a parte de refefinição de senha?"

### Resposta da IA:
Atualmente, **a redefinição de senha não está implementada no sistema**.

Aqui está o diagnóstico do estado atual:
1. **Na Interface do Usuário (Login):** No arquivo `login.vue`, o formulário de login tem apenas as opções de entrar (login direto) ou solicitar acesso. Não existe nenhum botão ou link de "Esqueceu a senha?" ou "Redefinir Senha".
2. **No Composable de Autenticação:** No `useAuth.ts`, existem apenas as funções de `login`, `register` e `logout`. Não há integração com as funções de recuperação do Supabase (como `supabase.auth.resetPasswordForEmail()` para enviar o e-mail de recuperação, ou `supabase.auth.updateUser()` para salvar a nova senha).
3. **Página de Confirmação (`confirm.vue`):** A página `confirm.vue` é responsável apenas por receber o redirecionamento quando o usuário clica no e-mail de confirmação de cadastro novo, gerando a sessão e redirecionando o usuário para a página inicial (`/`). Ela não está preparada para capturar o fluxo de redefinição de senha.

---

### Solicitação do Usuário:
> "pensando nas varias possibilidades de acesso e redefinicao de sneha e outros casos que podermia acontecer dito isso quero que me ajude a pensar nas possibilidades de erro sistema e fluxo!
> 
> dito isso no fluxo de hoje q ele solicita o acesso e tem q esperar o admim liberar como ficaria se ele quisese trocar a senha sem o admim ter liberado o acesso ainda essa e uma duvida q levantei!
> 
> veja outras possiblidades tbm q talves eu n enxergue!
> 
> somente responda n faca nada ianda!!!"

### Resposta da IA:
Analisando a estrutura atual do banco de dados, da Edge Function (`verificar-e-cadastrar`) e do middleware de rotas, identifiquei os seguintes cenários:

#### Cenário 1: Trocar senha antes do Admin liberar o acesso (Status `pendente`)
* **Como funciona a criação do usuário hoje:** Quando o competidor clica em "Enviar Solicitação", a Edge Function cria imediatamente uma conta real e ativa no Supabase Auth (`email_confirm: true`) e insere o registro na tabela `usuarios` com `status = 'pendente'`.
* **Como ficaria se ele tentar redefinir a senha antes da aprovação:**
  1. O fluxo de envio de e-mail de redefinição funcionará, pois a conta já existe no Supabase Auth.
  2. Se a rota `/redefinir-senha` for pública no `checkStatus.global.ts` (ex: `const publicPaths = ['/login', '/confirm', '/redefinir-senha']`), ele poderá digitar a nova senha normalmente.
  3. Após redefinir, caso tente navegar, o middleware interceptará o `status = 'pendente'` e o travará de volta na tela `/aguardando-aprovacao`.
  * **Conclusão:** Funciona perfeitamente e é seguro. Ele consegue atualizar suas credenciais, mas continua bloqueado de ver o bolão.

#### Cenário 2: O Usuário Rejeitado (Status `rejeitado`)
* **O Problema:** Se o administrador rejeitar a solicitação, o status vai para `'rejeitado'`. O usuário conseguirá logar pelo Supabase Auth, mas o middleware de rotas detectará `'rejeitado'` e o jogará de volta para `/login` em loop. Se ele tentar solicitar acesso de novo, o sistema diz: *"E-mail já cadastrado, faça login"*.
* **Mitigação Recomendada:** A tela de login precisa exibir um alerta informando que a solicitação dele foi rejeitada, oferecendo o botão de logout ou nova tentativa com outro e-mail.

#### Cenário 3: Usuário já pré-autorizado solicita acesso
* **O Problema:** Se o administrador colocou o e-mail em `email_autorizados`, mas o usuário usar o formulário de "Solicitar Acesso" em vez de tentar logar diretamente, a Edge Function criará a conta dele como `'pendente'`.
* **Mitigação Recomendada:** Na Edge Function, verificar se o e-mail está na lista de autorizados antes de criar como `'pendente'`. Se estiver, criar direto como `'ativo'`.

#### Cenário 4: Redirecionamento correto no `confirm.vue`
* **O Problema:** O `confirm.vue` hoje assume que todo redirect do e-mail é um login inicial de novo cadastro. Em uma redefinição de senha, ele faria o login mas jogaria o usuário para `/` sem permitir que ele digite a nova senha.
* **Mitigação Recomendada:** Tratar o parâmetro de hash ou query `type=recovery` no `confirm.vue` e mandar o usuário para a página específica de alteração de senha.
