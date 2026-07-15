import { ref } from 'vue'
import { useState } from '#app'
import { useSupabaseClient } from '#imports'

export interface Solicitacao {
  id: string
  tipo: 'acesso_sistema' | 'acesso_bolao' | 'outro'
  status: 'pendente' | 'aprovada' | 'rejeitada'
  email: string
  nome: string | null
  user_id: string | null
  telefone: string | null
  cidade: string | null
  estado: string | null
  mensagem: string | null
  campeonato_id: string | null
  admin_id: string | null
  motivo_rejeicao: string | null
  created_at: string
  resolved_at: string | null
  // joined
  campeonato?: { id: string; nome: string; logo_url: string | null; apelido_grupo?: string | null } | null
}

export const useSolicitacoes = () => {
  const supabase = useSupabaseClient()
  const pendingCount = useState<number>('solicitacoes-pending-count', () => 0)
  const loading = ref(false)

  // ── Fetch pending count (lightweight, for badges) ──
  const fetchPendingCount = async () => {
    const { count, error } = await supabase
      .from('solicitacoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')
    
    if (!error && count !== null) {
      pendingCount.value = count
    }
  }

  // ── Fetch all solicitações with optional filter ──
  const fetchSolicitacoes = async (statusFilter?: string): Promise<Solicitacao[]> => {
    loading.value = true
    let query = supabase
      .from('solicitacoes')
      .select('*, campeonato:campeonatos(id, nome, logo_url, apelido_grupo)')
      .order('created_at', { ascending: false })

    if (statusFilter && statusFilter !== 'todas') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query
    loading.value = false
    
    if (error) {
      console.error('Erro ao buscar solicitações:', error.message)
      return []
    }
    return (data || []) as Solicitacao[]
  }

  const aprovarSolicitacao = async (
    sol: Solicitacao, 
    bolaoIds: string[], 
    adminId: string
  ) => {
    loading.value = true
    try {
      // 1. If acesso_sistema: add email to email_autorizados
      if (sol.tipo === 'acesso_sistema') {
        await supabase.from('email_autorizados').upsert(
          { email: sol.email, nome_ref: sol.nome || undefined },
          { onConflict: 'email' }
        )
      }

      // 2. Update user status to 'ativo'
      if (sol.user_id) {
        await supabase
          .from('usuarios')
          .update({ status: 'ativo' })
          .eq('id', sol.user_id)
      }

      // 3. Assign bolão access (if selected)
      if (bolaoIds.length > 0) {
        const toInsert = bolaoIds.map(campeonato_id => ({
          email: sol.email,
          campeonato_id
        }))
        await supabase.from('campeonato_acessos').upsert(toInsert, {
          onConflict: 'id'
        })
      }

      // 4. If acesso_bolao: insert specific campeonato access
      if (sol.tipo === 'acesso_bolao' && sol.campeonato_id) {
        await supabase.from('campeonato_acessos').upsert({
          email: sol.email,
          campeonato_id: sol.campeonato_id
        }, { onConflict: 'id' })

        // 4b. Auto-resolve pending acesso_sistema for the same user, if any.
        //     Approving someone for the championship implies accepting them into the system.
        const { data: pendingSistema } = await supabase
          .from('solicitacoes')
          .select('id')
          .eq('email', sol.email)
          .eq('tipo', 'acesso_sistema')
          .eq('status', 'pendente')
          .maybeSingle()

        if (pendingSistema) {
          // Add to email_autorizados
          await supabase.from('email_autorizados').upsert(
            { email: sol.email, nome_ref: sol.nome || undefined },
            { onConflict: 'email' }
          )

          // Mark the sistema request as approved
          await supabase
            .from('solicitacoes')
            .update({
              status: 'aprovada',
              admin_id: adminId,
              resolved_at: new Date().toISOString()
            })
            .eq('id', pendingSistema.id)
        }
      }

      // 5. Update the solicitação
      await supabase
        .from('solicitacoes')
        .update({
          status: 'aprovada',
          admin_id: adminId,
          resolved_at: new Date().toISOString()
        })
        .eq('id', sol.id)

      // 6. Refresh count
      await fetchPendingCount()
    } finally {
      loading.value = false
    }
  }

  // ── Reject a request ──
  const rejeitarSolicitacao = async (
    solId: string, 
    adminId: string, 
    motivo?: string,
    userId?: string | null,
    tipo?: string | null
  ) => {
    loading.value = true
    try {
      // CRITICAL FIX: Só marca o usuário como 'rejeitado' se for uma solicitação de
      // acesso ao SISTEMA (acesso_sistema). Rejeitar acesso a um BOLÃO (acesso_bolao)
      // não deve bloquear o usuário — ele já está ativo no sistema e apenas pediu
      // acesso a um bolão específico. Marcar como 'rejeitado' causaria redirect forçado
      // para o login em todas as ações do usuário.
      if (userId && tipo === 'acesso_sistema') {
        await supabase
          .from('usuarios')
          .update({ status: 'rejeitado' })
          .eq('id', userId)
      }

      // Update the solicitação
      await supabase
        .from('solicitacoes')
        .update({
          status: 'rejeitada',
          admin_id: adminId,
          motivo_rejeicao: motivo || null,
          resolved_at: new Date().toISOString()
        })
        .eq('id', solId)

      await fetchPendingCount()
    } finally {
      loading.value = false
    }
  }

  // ── Create a bolão access request (for logged-in users) ──
  const solicitarAcessoBolao = async (
    email: string,
    userId: string,
    campeonatoId: string,
    nome?: string
  ) => {
    // Check for existing pending request for this bolão
    const { data: existente } = await supabase
      .from('solicitacoes')
      .select('id')
      .eq('email', email)
      .eq('tipo', 'acesso_bolao')
      .eq('campeonato_id', campeonatoId)
      .eq('status', 'pendente')
      .maybeSingle()

    if (existente) {
      throw new Error('Você já possui uma solicitação pendente para este bolão.')
    }

    await supabase.from('solicitacoes').insert({
      tipo: 'acesso_bolao',
      status: 'pendente',
      email,
      nome: nome || null,
      user_id: userId,
      campeonato_id: campeonatoId
    })

    await fetchPendingCount()
  }

  return {
    pendingCount,
    loading,
    fetchPendingCount,
    fetchSolicitacoes,
    aprovarSolicitacao,
    rejeitarSolicitacao,
    solicitarAcessoBolao
  }
}
