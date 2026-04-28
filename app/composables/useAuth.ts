import { computed, watch } from 'vue'
import { navigateTo, useState } from '#app'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import type { Database } from '~/types/database.types'
import type { Usuario } from '~~/shared/types/Usuario'

export const useAuth = () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  // Perfil público do usuário vindo da tabela public.usuarios
  const profile = useState<Usuario | null>('user-profile', () => null)
  
  const isAdmin = computed(() => profile.value?.is_admin === true)

  // Busca o perfil público sempre que o UUID do Auth mudar
  watch(user, async (newUser) => {
    // useSupabaseUser() retorna JwtPayload — o UUID está em 'sub', não 'id'
    const uid = newUser?.sub
    if (newUser && uid) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', uid)
        .single()
        
      if (error) {
        // Fallback: se o perfil não existe (PGRST116), tenta criar manualmente.
        if (error.code === 'PGRST116') {
          const emailStr = (newUser as any).email || ''
          const fallbackName = emailStr.split('@')[0] || 'Jogador'
          
          const { data: newData } = await (supabase
            .from('usuarios')
            .insert({
              id: uid,
              email: emailStr,
              nome: fallbackName
            } as any) as any)
            .select('*')
            .single()
            
          if (newData) {
            profile.value = newData as unknown as Usuario
          }
        }
      } else if (data) {
        profile.value = data as unknown as Usuario
      }
    } else {
      profile.value = null
    }
  }, { immediate: true })

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  const register = async (email: string, password: string, nome: string) => {
    // Chama a Edge Function para validação de e-mail e criação de conta
    const { data, error } = await supabase.functions.invoke('verificar-e-cadastrar', {
      body: { email, password, nome }
    })
    
    // O invoke do supabase pode retornar erro de rede no block error
    if (error) throw error
    
    // Erros tratados pela Edge Function retornam 200/400 com data.error
    if (data?.error) throw new Error(data.error)
    
    // Se deu sucesso, o usuário foi criado. 
    // Como foi criado via admin API no backend, precisamos logar no cliente agora.
    await login(email, password)
  }

  const logout = async () => {
    // Força limpeza local mesmo que o servidor rejeite a sessão (ex: usuário deletado no banco)
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (_) {
      // ignora erro do servidor — o importante é limpar o lado do cliente
    }
    profile.value = null
    useState('lista-campeonatos').value = []
    useState('campeonato-ativo').value = null
    useState('campeonato-acesso-atual').value = null
    if (process.client) {
       localStorage.removeItem('bolao_ativo_id')
    }
    await navigateTo('/login')
  }

  return {
    user,
    profile,
    isAdmin,
    login,
    register,
    logout
  }
}
