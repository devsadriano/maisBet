Implemente um sistema completo de notificações push web para um software em Nuxt 4, com backend server routes/Nitro, frontend Vue 3 e autenticação baseada em usuário logado (supabase).

Quero algo com arquitetura limpa, produção-ready e foco em navegador web.

Objetivo
Criar um sistema de web push notification que permita:
1. solicitar permissão do navegador
2. registrar um service worker
3. criar uma PushSubscription usando VAPID
4. enviar a subscription para o backend
5. persistir essa subscription no banco
6. salvar preferências de notificação por usuário
7. disparar notificações a partir do backend
8. abrir/focar a rota correta ao clicar na notificação
9. suportar múltiplos dispositivos/navegadores por usuário
10. ser adequado para SaaS multi-tenant

Stack alvo
- Nuxt 4
- Vue 3
- Nitro server routes
- TypeScript
- banco supabase
- autenticação por usuário logado
- biblioteca `web-push` no backend

Requisitos técnicos
1. Frontend
- criar uma tela/composable para:
  - verificar suporte a `serviceWorker` e `PushManager`
  - pedir `Notification.requestPermission()`
  - registrar `/sw.js`
  - criar subscription com `registration.pushManager.subscribe`
  - enviar subscription ao backend
- permitir ativar/desativar push
- permitir salvar preferências por tipo de evento
- implementar unsubscribe real ao desligar push
- tratar erros de permissão negada, browser sem suporte e falha de registro

2. Service Worker
- criar `public/sw.js`
- ao receber push:
  - ler `event.data.json()`
  - exibir notificação com `title`, `message`, `icon`, `badge`, `url`
- ao clicar:
  - fechar notificação
  - focar aba existente se houver
  - navegar para a URL recebida
  - abrir nova aba se necessário

3. Backend
- criar endpoint autenticado para registrar subscription
- criar endpoint autenticado para remover subscription
- criar serviço `PushService`
- o serviço deve:
  - configurar VAPID com env vars
  - enviar notificação para uma subscription específica
  - enviar notificação para todas as subscriptions ativas de um usuário
  - enviar notificação em lote para usuários de uma organização/tenant
  - limpar subscriptions inválidas automaticamente quando `web-push` retornar 404/410

4. Persistência
Não salvar a subscription em `user_metadata` do auth provider.
Quero um desenho melhor, com tabela própria, por exemplo:
- `push_subscriptions`
  - id
  - user_id
  - organization_id nullable ou opcional se o sistema for multi-tenant por contexto
  - endpoint
  - p256dh
  - auth
  - user_agent
  - device_label opcional
  - created_at
  - updated_at
  - last_used_at
  - disabled_at nullable
  - permission_state opcional
  - unique constraint apropriada por endpoint

Também criar uma tabela ou estrutura para preferências:
- `notification_preferences`
  - user_id
  - organization_id opcional se fizer sentido por tenant
  - push_enabled
  - email_enabled opcional
  - tipos de eventos configuráveis

Se achar melhor, você pode sugerir um schema superior, mas precisa justificar.

5. Multi-tenant
O sistema deve ser desenhado para SaaS:
- não usar uma única subscription global por usuário se isso impedir multi-dispositivo
- suportar múltiplos browsers/dispositivos por usuário
- suportar escopo por tenant se necessário
- impedir que um tenant dispare push para usuários de outro tenant

6. Eventos suportados
Implemente estrutura para eventos como:
- `new_conversation`
- `assigned_to_you`
- `awaiting_human`
- `new_message_assigned`
- `sla_timeout`

Quero uma forma clara de mapear preferências por evento.

7. Segurança
- endpoints de subscribe/unsubscribe devem exigir autenticação
- validar ownership do usuário
- não confiar em dados do client além do necessário
- usar env vars:
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `EMAIL_FROM` ou contato administrativo se precisar no `setVapidDetails`

8. Experiência de uso
- criar UI simples para preferências
- mostrar feedback de sucesso/erro
- se o usuário negar permissão, refletir isso na interface
- se o navegador não suportar push, mostrar mensagem adequada

9. Entregáveis
Quero que você entregue:
- estrutura de arquivos proposta
- schema SQL ou migrations
- service worker
- composable/frontend de subscribe/unsubscribe
- server routes
- serviço backend `PushService`
- exemplo de disparo de notificação
- instruções de configuração de env
- explicação de como testar localmente e em produção
- observações sobre HTTPS e limitações de browsers

10. Qualidade
- código limpo e tipado
- sem gambiarra
- sem salvar subscription em metadata do usuário
- explicar tradeoffs
- incluir tratamento de erro realista
- incluir cleanup de subscriptions inválidas
- incluir suporte a múltiplas subscriptions por usuário

Formato da resposta
1. arquitetura proposta
2. schema de banco
3. backend
4. frontend
5. service worker
6. fluxo ponta a ponta
7. checklist de produção
8. possíveis melhorias futuras