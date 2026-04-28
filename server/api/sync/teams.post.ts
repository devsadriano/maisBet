import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const supabase = await serverSupabaseServiceRole<any>(event)

  try {
    const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY
    if (!FOOTBALL_DATA_KEY) {
      throw createError({ statusCode: 500, message: 'FOOTBALL_DATA_KEY is missing' })
    }

    const body = await readBody(event).catch(() => ({}))
    const api_competition_code = body?.api_competition_code || 'BSA'

    // Busca os times do campeonato solicitado na API externa
    const res = await fetch(`https://api.football-data.org/v4/competitions/${api_competition_code}/teams`, {
      headers: {
        'X-Auth-Token': FOOTBALL_DATA_KEY
      }
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw createError({ statusCode: res.status, message: `API Error: ${errorText}` })
    }

    const data = await res.json()
    const teams = data.teams || []

    let updatedCount = 0

    // Atualiza ou insere os times no Supabase batendo pelo api_team_id
    for (const team of teams) {
      const { id: api_team_id, crest, name, shortName } = team

      if (crest || name) {
        const teamName = shortName || name || 'Desconhecido'
        
        // Verifica se já existe
        const { data: existing } = await supabase
          .from('times')
          .select('id')
          .eq('api_team_id', api_team_id)
          .maybeSingle()

        if (existing) {
          // Atualiza escudo e nome (caso tenha mudado)
          const { error } = await supabase
            .from('times')
            .update({ escudo_url: crest, nome: teamName })
            .eq('id', existing.id)

          if (!error) {
            updatedCount++
          } else {
            console.error(`Error updating team ${api_team_id}:`, error)
          }
        } else {
          // Insere time novo (ex: Copa do Muno, seleções novas, etc.)
          const { error } = await supabase
            .from('times')
            .insert({ 
               api_team_id: api_team_id, 
               escudo_url: crest || null, 
               nome: teamName 
            })

          if (!error) {
            updatedCount++
          } else {
             console.error(`Error inserting team ${api_team_id}:`, error)
          }
        }
      }
    }

    return { 
      success: true, 
      message: `Updated escudos for ${updatedCount} teams!`,
      updated: updatedCount
    }

  } catch (err: any) {
    console.error('Error in /api/sync/teams:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal Server Error'
    })
  }
})
