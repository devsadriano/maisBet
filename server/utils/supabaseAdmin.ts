// server/utils/supabaseAdmin.ts
// Helper para acessar o Supabase com a Service Role Key (bypassa RLS).
// Usar SOMENTE em rotas server-side (server/api/).
// NUNCA importar em componentes Vue ou composables client-side.

import { serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

/**
 * Retorna o cliente Supabase com permissões de service_role.
 * Utilizar para operações que precisam contornar o RLS:
 *   - Sincronização da API-Sports
 *   - Criação de rodadas (admin)
 *   - Atualização de resultados
 */
export function useSupabaseAdmin(event: H3Event) {
  return serverSupabaseServiceRole(event)
}
