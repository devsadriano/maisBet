// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: any, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { email, password, nome, telefone, cidade, mensagem, modo = 'registrar' } = await req.json()

    if (!email || !password || !nome) {
      return json({ error: 'Faltam dados: email, password, ou nome.' }, 400)
    }

    // ───────────────────────────────────────────────────────────────
    // MODO REGISTRAR (fluxo original — email já autorizado)
    // ───────────────────────────────────────────────────────────────
    if (modo === 'registrar') {
      // Verifica se o email está na tabela de autorizados
      const { data: autorizado, error: errCheck } = await supabase
        .from('email_autorizados')
        .select('id')
        .eq('email', email)
        .single()

      if (errCheck || !autorizado) {
        return json({ error: 'Seu e-mail não está na lista de participantes. Entre em contato com o administrador.' }, 403)
      }

      // Se está autorizado, cria o usuário no Auth
      const { data: userAuth, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome }
      })

      if (authError) {
        return json({ error: authError.message }, 400)
      }

      // Cria perfil na tabela usuarios com status ativo
      if (userAuth?.user) {
        await supabase.from('usuarios').upsert({
          id: userAuth.user.id,
          email,
          nome,
          status: 'ativo',
          telefone: telefone || null,
          cidade: cidade || null,
        }, { onConflict: 'id' })
      }

      return json({ success: true, mode: 'registrar', user: userAuth.user })
    }

    // ───────────────────────────────────────────────────────────────
    // MODO SOLICITAR (conta limitada + solicitação pendente)
    // ───────────────────────────────────────────────────────────────
    if (modo === 'solicitar') {
      // 1. Verifica se já existe solicitação pendente para esse email
      const { data: existente } = await supabase
        .from('solicitacoes')
        .select('id')
        .eq('email', email)
        .eq('tipo', 'acesso_sistema')
        .eq('status', 'pendente')
        .maybeSingle()

      if (existente) {
        return json({ error: 'Você já possui uma solicitação pendente. Aguarde a análise do administrador.' }, 409)
      }

      // 2. Verifica se já existe um user com esse email na tabela usuarios
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingUser) {
        return json({ error: 'Já existe uma conta com este e-mail. Tente fazer login.' }, 409)
      }

      // 3. Cria user no Auth (conta real, mas será limitada pelo frontend)
      const { data: userAuth, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome }
      })

      if (authError) {
        return json({ error: authError.message }, 400)
      }

      const userId = userAuth.user.id

      // 4. Cria perfil na tabela usuarios com status 'pendente'
      await supabase.from('usuarios').upsert({
        id: userId,
        email,
        nome,
        status: 'pendente',
        telefone: telefone || null,
        cidade: cidade || null,
      }, { onConflict: 'id' })

      // 5. Cria solicitação na tabela solicitacoes
      await supabase.from('solicitacoes').insert({
        tipo: 'acesso_sistema',
        status: 'pendente',
        email,
        nome,
        user_id: userId,
        telefone: telefone || null,
        cidade: cidade || null,
        mensagem: mensagem || null,
      })

      return json({ success: true, mode: 'solicitar' })
    }

    return json({ error: 'Modo inválido. Use "registrar" ou "solicitar".' }, 400)

  } catch (error) {
    return json({ error: error.message }, 500)
  }
})
