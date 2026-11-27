import { serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler, getQuery } from 'h3'

export type RuleScope = 'liga' | 'copa' | 'geral'

export type RuleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'callout'; variant: 'brand' | 'amber' | 'blue'; title: string; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }

export interface RuleSection {
  id: string
  number: string
  scope: RuleScope
  icon: string
  title: string
  badge: string
  blocks: RuleBlock[]
}

export interface RulesResponse {
  formato: 'liga' | 'copa'
  meta: {
    max_rodadas: number
    fuso_horario: string
    fuso_label: string
    scoring: {
      placar_exato: number
      vencedor_correto: number
      errou: number
    }
  }
  sections: RuleSection[]
  content: string
}

const FUSO_LABELS: Record<string, string> = {
  'America/Sao_Paulo': 'Brasília (UTC-3)',
  'America/Campo_Grande': 'Campo Grande - MS (UTC-4)',
  'America/Cuiaba': 'Cuiabá - MT (UTC-4)',
  'America/Manaus': 'Manaus / Amazônia (UTC-4)',
  'America/Rio_Branco': 'Acre (UTC-5)',
  'America/Noronha': 'Fernando de Noronha (UTC-2)'
}

const COPA_CODES = ['WC', 'EC', 'CAF', 'AFC', 'CONC', 'OFC', 'CAN', 'CLI', 'CWC']
const COPA_NAME_KEYWORDS = [
  'world cup',
  'copa do mundo',
  'copa mundial',
  'copa america',
  'eurocopa',
  'nations cup',
  'african cup',
  'gold cup',
  'continental'
]

function detectFormato(camp: any, isCopaFallback: boolean): 'liga' | 'copa' {
  if (!camp) return isCopaFallback ? 'copa' : 'liga'
  if (camp.formato === 'copa') return 'copa'
  if (camp.formato === 'liga') return 'liga'

  const code = String(camp.api_competition_code || '').toUpperCase()
  if (code && COPA_CODES.some(c => code === c || code.startsWith(c))) return 'copa'

  const nome = String(camp.nome || '').toLowerCase()
  if (COPA_NAME_KEYWORDS.some(k => nome.includes(k))) return 'copa'

  return isCopaFallback ? 'copa' : 'liga'
}

function formatPts(value: number): string {
  return `${value} ${value === 1 ? 'ponto' : 'pontos'}`
}

function formatMultPts(base: number, mult: number): string {
  const result = Number((base * mult).toFixed(1))
  return `${result} ${result === 1 ? 'pt' : 'pts'}`
}

function buildSections(params: {
  formato: 'liga' | 'copa'
  maxRodadas: number
  fusoLabel: string
  scoring: { placar_exato: number; vencedor_correto: number; errou: number }
}): RuleSection[] {
  const { formato, maxRodadas, fusoLabel, scoring } = params
  const penultima = Math.max(1, maxRodadas - 1)

  const ligaSections: Omit<RuleSection, 'number'>[] = [
    {
      id: 'liga-composicao',
      scope: 'liga',
      icon: '⚽',
      title: 'Composição da Rodada (Quais jogos entram?)',
      badge: 'LIGA',
      blocks: [
        {
          type: 'list',
          items: [
            `**Rodadas Normais (1ª à ${penultima}ª rodada):** não entram todos os jogos do campeonato. Participam apenas os **jogos obrigatórios** (partidas envolvendo o time do coração de qualquer participante inscrito neste bolão) somados aos **jogos extras** escolhidos pelo Organizador da rodada.`,
            `**Fórmula dos Jogos Extras e Confronto Direto:** a quantidade de extras segue a regra **\`1 + número de confrontos diretos\`** entre times de participantes naquela rodada. Quando dois participantes se enfrentam, o total de jogos obrigatórios diminui e o sistema adiciona +1 jogo extra para manter o equilíbrio:`,
            '**Exemplos práticos:** Sem confronto direto = **1 jogo extra** • 1 confronto direto = **2 jogos extras** • 2 confrontos diretos = **3 jogos extras**.'
          ]
        },
        {
          type: 'callout',
          variant: 'brand',
          title: `🔥 Regra da Última Rodada (${maxRodadas}ª Rodada)`,
          text: `Na última rodada do campeonato (**${maxRodadas}ª rodada**), **TODOS os jogos da rodada entram automaticamente como obrigatórios!** Não há escolha de jogos extras (**0 extras**) e não há atuação de Organizador — a rodada já abre diretamente para palpites.`
        }
      ]
    },
    {
      id: 'liga-time-coracao',
      scope: 'liga',
      icon: '🛡️',
      title: 'Time do Coração',
      badge: 'LIGA',
      blocks: [
        {
          type: 'list',
          items: [
            '**Escolha definitiva:** ao entrar no bolão, cada participante seleciona um clube do campeonato como seu **Time do Coração**. Após confirmada, a escolha **não pode ser alterada** durante o torneio.',
            '**Independência entre bolões:** quem participa de mais de um campeonato pode escolher clubes diferentes em cada bolão.',
            '**Efeito prático:** o escudo do clube selecionado aparece ao lado do seu nome no ranking e todas as partidas desse time tornam-se **obrigatórias** em todas as rodadas.'
          ]
        }
      ]
    },
    {
      id: 'liga-rodizio-organizador',
      scope: 'liga',
      icon: '👑',
      title: 'Rodízio do Organizador e Transparência',
      badge: 'LIGA',
      blocks: [
        {
          type: 'paragraph',
          text: `Em cada rodada normal (1ª à ${penultima}ª), o sistema elege automaticamente um participante para atuar como **Organizador** e definir os jogos extras da rodada.`
        },
        {
          type: 'list',
          ordered: true,
          items: [
            '**Quem organizou menos vezes** no campeonato vai primeiro;',
            '**Em caso de empate**, é escolhido **quem organizou há mais tempo**;',
            '**Persistindo o empate**, o desempate segue a **ordem alfabética** pelo nome.'
          ]
        },
        {
          type: 'list',
          items: [
            '**Equilíbrio e novos integrantes:** ninguém organiza uma segunda vez antes que todos os demais tenham organizado ao menos uma. Novos participantes aprovados durante o campeonato entram com `0` rodadas organizadas e ganham prioridade automática na fila. Administradores não participam do rodízio.',
            '**Prazo do Organizador e Fallback Automático:** o organizador tem até **1 hora antes do 1º jogo válido da rodada** para confirmar os extras. Caso o prazo expire sem escolha, o sistema **seleciona automaticamente de forma aleatória** (priorizando partidas com status agendado), abre a rodada e exibe o selo **`🤖 Escolha Automática`**.',
            '**Intervenção do Administrador e Auditoria Pública:** em situações excepcionais, o Administrador pode assumir/reconfigurar os extras (`👑 Extras Definidos pelo Admin`) ou alterar o organizador. Toda a fila futura e o histórico completo de cada rodada ficam públicos na página **Organizadores** com selos auditáveis (`✓ Regra Oficial` ou `⚠️ Escolha Manual`).'
          ]
        }
      ]
    }
  ]

  const copaSections: Omit<RuleSection, 'number'>[] = [
    {
      id: 'copa-composicao',
      scope: 'copa',
      icon: '🌍',
      title: 'Composição da Rodada (Todos os Jogos)',
      badge: 'COPA',
      blocks: [
        {
          type: 'list',
          items: [
            '**Todos os jogos entram na aposta:** diferente do formato Liga, 100% das partidas da rodada entram automaticamente como obrigatórias (**0 jogos extras**).',
            '**Sem Organizador:** não existe figura de Organizador nem rodízio — cada rodada é importada pelo sistema rodada a rodada (Fase de Grupos e fases do Mata-Mata) e já abre diretamente para palpites.',
            '**Visualização por Grupos:** durante a Fase de Grupos, as partidas aparecem organizadas pelos respectivos grupos do torneio.'
          ]
        }
      ]
    },
    {
      id: 'copa-selecao-coracao',
      scope: 'copa',
      icon: '🏳️',
      title: 'Seleção do Coração',
      badge: 'COPA',
      blocks: [
        {
          type: 'list',
          items: [
            'Ao entrar no bolão da Copa, cada participante escolhe uma **seleção nacional** como seu Time do Coração.',
            'A escolha é **definitiva** durante o torneio e exibe o escudo da seleção ao lado do nome do competidor no ranking (não restringe jogos, pois todas as partidas da Copa já são obrigatórias).'
          ]
        }
      ]
    },
    {
      id: 'copa-multiplicadores',
      scope: 'copa',
      icon: '🔥',
      title: 'Multiplicadores Progressivos por Fase',
      badge: 'COPA',
      blocks: [
        {
          type: 'paragraph',
          text: 'No formato Copa, os pontos base conquistados em cada partida são multiplicados conforme o peso da fase da competição:'
        },
        {
          type: 'table',
          headers: ['Fase', 'Rodada', 'Multiplicador', `Cravado (${scoring.placar_exato} pts)`, `Resultado (${scoring.vencedor_correto} pt)`],
          rows: [
            ['Fase de Grupos', '1ª à 3ª', '**×1.0**', formatMultPts(scoring.placar_exato, 1.0), formatMultPts(scoring.vencedor_correto, 1.0)],
            ['Oitavas de Final', '4ª', '**×1.0**', formatMultPts(scoring.placar_exato, 1.0), formatMultPts(scoring.vencedor_correto, 1.0)],
            ['Quartas de Final', '5ª', '**×1.5**', formatMultPts(scoring.placar_exato, 1.5), formatMultPts(scoring.vencedor_correto, 1.5)],
            ['Semifinal', '6ª', '**×2.0**', formatMultPts(scoring.placar_exato, 2.0), formatMultPts(scoring.vencedor_correto, 2.0)],
            ['Final / 3º Lugar', '7ª', '**×3.0**', formatMultPts(scoring.placar_exato, 3.0), formatMultPts(scoring.vencedor_correto, 3.0)]
          ]
        },
        {
          type: 'paragraph',
          text: '*Obs.: Nas Quartas de Final (`×1.5`), a pontuação pode resultar em valores decimais (ex.: `1.5 pts` ou `4.5 pts`), que são preservados integralmente no Ranking Geral e no Ranking da Rodada.*'
        }
      ]
    },
    {
      id: 'copa-especiais-matamata',
      scope: 'copa',
      icon: '🎯',
      title: 'Palpites Especiais e Placar no Mata-Mata',
      badge: 'COPA',
      blocks: [
        {
          type: 'list',
          items: [
            '**Palpites Especiais de Longo Prazo:** na tela de palpites da Copa ficam disponíveis 3 apostas bônus somadas diretamente ao **Ranking Geral**: **Grande Campeão (+10 pts)**, **Artilheiro (+10 pts)** e **Melhor do Grupo / Melhor Campanha (+5 pts)**.',
            '**Privacidade dos Especiais:** os palpites especiais de cada competidor ficam visíveis apenas para o próprio autor até o encerramento oficial do campeonato (`status = finalizado`).'
          ]
        },
        {
          type: 'callout',
          variant: 'amber',
          title: '⚖️ Prorrogação, Pênaltis e Placar Oficial',
          text: 'Nos jogos eliminatórios (Mata-Mata), a pontuação considera exclusivamente o placar oficial de tempo de jogo (`fullTime`) sincronizado pela API oficial (`Football-Data.org`). **Disputas de pênaltis não alteram o placar da partida para fins de aposta e não existe pontuação bônus separada para classificado nos pênaltis.**'
        }
      ]
    }
  ]

  const deadlineRuleText = formato === 'copa'
    ? `**Fechamento do Mercado:** na **Fase de Grupos** (1ª à 3ª rodada), os palpites encerram exatamente **1 hora antes** do primeiro jogo válido; a partir do **Mata-Mata** (4ª rodada em diante), encerram **2 horas antes** do primeiro jogo válido — sempre considerando o fuso horário oficial deste bolão (**${fusoLabel}**).`
    : `**Fechamento do Mercado:** os palpites encerram exatamente **1 hora antes** do início do primeiro jogo válido da rodada, sempre no fuso horário oficial configurado para este bolão (**${fusoLabel}**).`

  const geralSections: Omit<RuleSection, 'number'>[] = [
    {
      id: 'geral-pontuacao',
      scope: 'geral',
      icon: '📊',
      title: 'Pontuação e Fonte Oficial de Resultados',
      badge: 'GERAL',
      blocks: [
        {
          type: 'list',
          items: [
            `**PLACAR CRAVADO (${formatPts(scoring.placar_exato)}):** acertou exatamente os gols do mandante e do visitante.`,
            `**RESULTADO CORRETO (${formatPts(scoring.vencedor_correto)}):** acertou quem vence a partida ou acertou que termina empatada, mesmo errando o placar exato *(ex.: palpitou \`1×1\` e terminou \`0×0\` = **${formatPts(scoring.vencedor_correto)}**)*.`,
            `**ERRO OU AUSÊNCIA DE PALPITE (${formatPts(scoring.errou)}):** errou o resultado ou deixou de palpitar antes do fechamento. **Não há preenchimento automático** para quem esquecer de registrar palpite.`,
            '**Cálculo automático e auditável:** os placares oficiais são sincronizados via **Football-Data.org** e os pontos são calculados automaticamente por gatilho (trigger) direto no banco de dados assim que cada partida termina. Somente jogos com status **`finalizado`** somam no Ranking Geral.'
          ]
        }
      ]
    },
    {
      id: 'geral-prazos',
      scope: 'geral',
      icon: '⏱️',
      title: 'Prazos, Fuso Horário e Travas de Palpite',
      badge: 'GERAL',
      blocks: [
        {
          type: 'list',
          items: [
            deadlineRuleText,
            '**Edição livre antes do prazo:** enquanto a rodada estiver `aberta` e o mercado não tiver fechado, você pode alterar e salvar seus palpites quantas vezes desejar (placares permitidos de `0` a `20` gols).',
            '**Trava individual por partida:** mesmo que a rodada ainda esteja aberta, o sistema **não permite salvar ou alterar palpite** de uma partida cujo horário oficial de início já tenha começado.'
          ]
        }
      ]
    },
    {
      id: 'geral-adiados-calendario',
      scope: 'geral',
      icon: '📅',
      title: 'Jogos Adiados, Mudanças de Calendário e Rodadas Simultâneas',
      badge: 'GERAL',
      blocks: [
        {
          type: 'list',
          items: [
            '**Jogos Adiados, Cancelados ou Suspensos (`adiado`):** partidas com esse status valem **0 pontos para todos** e são **desconsideradas no cálculo do prazo de fechamento** da rodada.',
            '**Jogos já encerrados antes da importação:** também são ignorados ao definir o horário limite de palpites da rodada, evitando prazos vencidos no passado.',
            '**Encerramento automático da rodada:** uma rodada só muda para **`finalizada`** quando todas as suas partidas válidas (obrigatórias e extras) estiverem com status **`finalizado`** ou **`adiado`**.',
            '**Alteração de calendário (CBF/Organização):** o sistema verifica continuamente mudanças de data e hora. Quando há alteração, atualiza os horários, recalcula os prazos automaticamente, exibe um **banner de alerta** no app e envia notificação aos participantes.',
            '**Rodadas Simultâneas (Sobreposição de 72h):** caso a rodada atual esteja **`fechada`** (com jogos ainda em andamento) e o 1º jogo da rodada seguinte esteja a **menos de 72 horas (3 dias)** de começar, o sistema importa antecipadamente a próxima rodada para garantir prazo justo de organização e palpites. Um atalho no topo do app permite acompanhar a rodada em andamento no Ranking enquanto a próxima é preparada.'
          ]
        }
      ]
    },
    {
      id: 'geral-privacidade-admin',
      scope: 'geral',
      icon: '🔒',
      title: 'Privacidade (Apostas às Cegas) e Papel do Administrador',
      badge: 'GERAL',
      blocks: [
        {
          type: 'list',
          items: [
            '**Sigilo garantido pelo banco de dados (RLS):** enquanto a rodada estiver **`aberta`**, **ninguém vê os palpites dos outros participantes** — cada jogador visualiza exclusivamente os seus próprios palpites.',
            '**Revelação pública ao fechar o mercado:** assim que a rodada passa para **`fechada`** ou **`finalizada`**, todos os palpites ficam visíveis para conferência transparente em **Ranking → Visão por Rodada**.',
            '**Isolamento e Papel do Administrador:** cada campeonato possui ranking próprio e apenas participantes aprovados aparecem na tabela. **Administradores não pontuam e não participam do ranking**, podendo apenas gerenciar rodadas e, em casos excepcionais de problema técnico devidamente comunicado, lançar palpites em nome de um jogador enquanto a rodada estiver aberta.'
          ]
        }
      ]
    },
    {
      id: 'geral-desempate-ranking',
      scope: 'geral',
      icon: '🏆',
      title: 'Classificação, Critérios Oficiais de Desempate e Estatísticas',
      badge: 'GERAL',
      blocks: [
        {
          type: 'paragraph',
          text: 'Em caso de empate em pontos no **Ranking Geral** ou no **Ranking da Rodada**, a ordem de classificação é definida estritamente pelos critérios abaixo:'
        },
        {
          type: 'list',
          ordered: true,
          items: [
            '**Maior Pontuação Total** (já considerando multiplicadores e bônus, quando aplicáveis);',
            '**Maior número de Placares Cravados (Exatos)**;',
            '**Maior número de Acertos Parciais (Resultado Correto)**;',
            '**Ordem Alfabética do Nome** (critério final).'
          ]
        },
        {
          type: 'list',
          items: [
            '**Aproveitamento (%):** calculado no painel inicial pela fórmula `(Placares Cravados + Acertos Parciais) ÷ Total de Palpites em Jogos Finalizados × 100`.',
            '**Escalados pra Brasa:** em bolões com 3 ou mais participantes no Ranking Geral, a seção lúdica destaca o **penúltimo colocado** (*Auxiliar de Churrasco*) e o **último colocado** (*Mestre da Brasa*).'
          ]
        }
      ]
    },
    {
      id: 'geral-notificacoes',
      scope: 'geral',
      icon: '🔔',
      title: 'Notificações Push e Histórico no Sininho',
      badge: 'GERAL',
      blocks: [
        {
          type: 'paragraph',
          text: 'Os participantes podem ativar alertas em tempo real no aparelho e gerenciar suas preferências diretamente pelo ícone de sininho (**🔔**):'
        },
        {
          type: 'list',
          items: [
            ...(formato === 'liga'
              ? ['**Alertas de Organizador:** convocação imediata ao ser escolhido e lembretes faltando **12h, 6h e 1h** antes do prazo de definição dos extras.']
              : []),
            '**Abertura, Calendário e Mercado:** aviso de rodada aberta para palpites, mudanças de data/hora da CBF/Organização e confirmação de mercado fechado (palpites revelados).',
            '**Lembretes de Prazo (Somente Pendentes):** alertas faltando **12h, 6h e 1h** enviados exclusivamente para quem ainda não palpitou em todos os jogos válidos da rodada.',
            '**Resultados e Cravadas:** aviso em tempo real ao acertar um **Placar Cravado** e **Resumo Personalizado** ao final de cada rodada.',
            '**Histórico no Sininho:** todas as notificações recebidas ficam salvas para consulta no aplicativo por até **30 dias**.'
          ]
        }
      ]
    }
  ]

  const combined = [...(formato === 'copa' ? copaSections : ligaSections), ...geralSections]
  return combined.map((section, idx) => ({
    ...section,
    number: String(idx + 1).padStart(2, '0')
  }))
}

function sectionsToMarkdown(formato: 'liga' | 'copa', sections: RuleSection[]): string {
  const header = formato === 'copa'
    ? '# +BET — Regulamento Oficial (Formato Copa)'
    : '# +BET — Regulamento Oficial (Campeonato / Liga)'

  const body = sections.map((sec) => {
    const parts: string[] = [`## ${Number(sec.number)}. ${sec.title} [${sec.badge}]`]
    for (const block of sec.blocks) {
      if (block.type === 'paragraph') {
        parts.push(block.text)
      } else if (block.type === 'list') {
        parts.push(
          block.items
            .map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`))
            .join('\n')
        )
      } else if (block.type === 'callout') {
        parts.push(`> **${block.title}:** ${block.text}`)
      } else if (block.type === 'table') {
        const sep = block.headers.map(() => '---').join(' | ')
        const rows = block.rows.map(r => `| ${r.join(' | ')} |`).join('\n')
        parts.push(`| ${block.headers.join(' | ')} |\n| ${sep} |\n${rows}`)
      }
    }
    return parts.join('\n\n')
  }).join('\n\n')

  return `${header}\n\n${body}`
}

export default defineEventHandler(async (event): Promise<RulesResponse> => {
  const query = getQuery(event)
  const campeonatoId = typeof query.campeonato_id === 'string' ? query.campeonato_id.trim() : ''
  const isCopaFallback = query.isCopa === 'true'

  let camp: any = null
  if (campeonatoId) {
    try {
      const supabase = await serverSupabaseServiceRole<any>(event)
      const { data } = await supabase
        .from('campeonatos')
        .select('id, nome, apelido_grupo, formato, max_rodadas, fuso_horario, api_competition_code, scoring_system:scoring_systems(nome, descricao, regras)')
        .eq('id', campeonatoId)
        .maybeSingle()

      camp = data || null
    } catch (err) {
      console.warn('[api/regras] Não foi possível consultar campeonato no banco, usando fallback padrão:', err)
    }
  }

  const formato = detectFormato(camp, isCopaFallback)
  const fusoHorario = camp?.fuso_horario || 'America/Sao_Paulo'
  const fusoLabel = FUSO_LABELS[fusoHorario] || fusoHorario
  const maxRodadas = Number(camp?.max_rodadas) || (formato === 'copa' ? 7 : 38)

  const rawScoring = camp?.scoring_system?.regras || {}
  const scoring = {
    placar_exato: rawScoring.placar_exato !== undefined ? Number(rawScoring.placar_exato) : 3,
    vencedor_correto: rawScoring.vencedor_correto !== undefined ? Number(rawScoring.vencedor_correto) : 1,
    errou: rawScoring.errou !== undefined ? Number(rawScoring.errou) : 0
  }

  const sections = buildSections({
    formato,
    maxRodadas,
    fusoLabel,
    scoring
  })

  return {
    formato,
    meta: {
      max_rodadas: maxRodadas,
      fuso_horario: fusoHorario,
      fuso_label: fusoLabel,
      scoring
    },
    sections,
    content: sectionsToMarkdown(formato, sections)
  }
})
