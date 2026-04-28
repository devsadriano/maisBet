// server/utils/requireAdmin.ts
// Proteção server-side para rotas exclusivas de administradores.
// Deve ser chamado no INÍCIO de qualquer event handler que requer is_admin.
//
// Diferente do middleware client-side (isAdmin.ts), esta verificação
// ocorre no servidor e não pode ser contornada via curl, Postman, etc.

import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

/**
 * Verifica se o usuário autenticado é administrador.
 * Lança HTTP 401 se não estiver autenticado.
 * Lança HTTP 403 se estiver autenticado mas não for admin.
 *
 * @example
 * export default defineEventHandler(async (event) => {
 *   await requireAdmin(event)
 *   // ... lógica da rota
 * })
 */
export async function requireAdmin(event: H3Event): Promise<void> {
  // 1. Verifica se existe sessão ativa
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: authError } = await client.auth.getUser()

  if (authError || !user) {
    throw createError({
      statusCode: 401,
      message: 'Autenticação necessária.'
    })
  }

  // 2. Verifica is_admin no banco usando service role (sem RLS)
  //    para garantir que a query sempre funciona mesmo com políticas restritivas
  const adminClient = await serverSupabaseServiceRole<any>(event)
  const { data, error: dbError } = await adminClient
    .from('usuarios')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (dbError || !data) {
    throw createError({
      statusCode: 403,
      message: 'Perfil de usuário não encontrado.'
    })
  }

  if (data.is_admin !== true) {
    throw createError({
      statusCode: 403,
      message: 'Acesso restrito a administradores.'
    })
  }
  // Se chegou aqui: usuário autenticado e is_admin = true ✅
}
