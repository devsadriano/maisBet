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

  // Flag que indica se o perfil já foi carregado do banco
  // CRITICAL: Sem isso, o middleware assume 'ativo' antes do perfil carregar
  const profileLoaded = useState<boolean>('user-profile-loaded', () => false)
  const profileLoading = useState<boolean>('user-profile-loading', () => false)
  
  const isAdmin = computed(() => profile.value?.is_admin === true)

  // SECURITY FIX: fallback é null (desconhecido) em vez de 'ativo'
  // O middleware deve tratar null como "ainda carregando" e bloquear acesso
  const userStatus = computed(() => {
    if (!user.value) return null
    if (!profileLoaded.value) return null  // perfil ainda não carregou
    return profile.value?.status ?? 'pendente' // se não tem perfil, assume pendente (seguro)
  })

  const fetchProfile = async () => {
    const uid = user.value?.sub || user.value?.id
    if (user.value && uid) {
      profileLoading.value = true
      profileLoaded.value = false
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', uid)
        .single()
        
      if (error) {
        if (error.code === 'PGRST116') {
          const emailStr = (user.value as any).email || ''
          const fallbackName = emailStr.split('@')[0] || 'Jogador'
          
          const { data: newData } = await supabase
            .from('usuarios')
            .insert({
              id: uid,
              email: emailStr,
              nome: fallbackName
            } as any)
            .select('*')
            .single()
            
          if (newData) {
            profile.value = newData as unknown as Usuario
          }
        }
      } else if (data) {
        profile.value = data as unknown as Usuario
      }
      profileLoaded.value = true
      profileLoading.value = false
    } else {
      profile.value = null
      profileLoaded.value = false
      profileLoading.value = false
    }
  }

  // Retorna uma promise que resolve quando o perfil terminar de carregar.
  // O middleware usa isso para ESPERAR o perfil antes de decidir redirecionar.
  const waitForProfile = async (): Promise<void> => {
    if (profileLoaded.value) return Promise.resolve()
    
    // Se temos um usuário mas não está carregando, inicia o carregamento agora!
    // Isso previne que o servidor (SSR) ou cliente fiquem travados aguardando infinitamente.
    if (user.value && !profileLoading.value) {
      await fetchProfile()
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const stop = watch(profileLoaded, (loaded) => {
        if (loaded) {
          stop()
          resolve()
        }
      })
    })
  }

  // Busca o perfil público sempre que o UUID do Auth mudar (no cliente)
  watch(user, async (newUser, oldUser) => {
    if (newUser?.id !== oldUser?.id) {
       await fetchProfile()
    }
  }, { immediate: false })

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
    profileLoaded.value = false
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
    profileLoaded,
    waitForProfile,
    fetchProfile,
    isAdmin,
    userStatus,
    login,
    register,
    logout
  }
}
