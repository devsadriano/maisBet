<template>
  <div class="space-y-8">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bebas tracking-wider text-white">Relatórios</h1>
        <p class="text-sm text-gray-400 mt-1">Exporte dados do bolão em PDF ou Excel.</p>
      </div>
      <NuxtLink to="/admin" class="text-xs px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-xl transition-all border border-white/10 uppercase tracking-wider active:scale-95">
        ← Voltar
      </NuxtLink>
    </div>

    <!-- Filtros -->
    <div class="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      <h2 class="text-sm font-black uppercase tracking-widest text-white">⚙️ Configurações do Relatório</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Seletor de Campeonato -->
        <div class="space-y-2">
          <label class="text-xs font-black uppercase tracking-wider text-gray-400">Campeonato</label>
          <select
            v-model="selectedCampId"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-purple-500/50 transition-colors"
          >
            <option value="" disabled class="bg-gray-900">Selecione um campeonato...</option>
            <option v-for="camp in campeonatos" :key="camp.id" :value="camp.id" class="bg-gray-900">
              {{ camp.nome }}{{ camp.apelido_grupo ? ` — ${camp.apelido_grupo}` : '' }}
            </option>
          </select>
        </div>

        <!-- Seletor de Rodada (corte) -->
        <div class="space-y-2">
          <label class="text-xs font-black uppercase tracking-wider text-gray-400">Até a Rodada</label>
          <select
            v-model="ateRodada"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-purple-500/50 transition-colors"
            :disabled="!selectedCampId"
          >
            <option value="" class="bg-gray-900">Todas as rodadas</option>
            <option v-for="n in maxRodadas" :key="n" :value="n" class="bg-gray-900">
              Rodada {{ n }}
            </option>
          </select>
        </div>
      </div>

      <!-- Botão Carregar -->
      <button
        @click="loadData"
        :disabled="!selectedCampId || loading"
        class="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg"
      >
        <span v-if="loading" class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        {{ loading ? 'Carregando...' : '🔍 Carregar Dados' }}
      </button>
    </div>

    <!-- Preview dos dados carregados -->
    <div v-if="reportData" class="space-y-6 animate-fade-in">

      <!-- Info Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <div class="text-2xl font-bebas text-purple-400">{{ reportData.meta.total_participantes }}</div>
          <div class="text-[10px] font-black uppercase tracking-wider text-gray-500 mt-1">Participantes</div>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <div class="text-2xl font-bebas text-brand-400">{{ reportData.meta.total_rodadas }}</div>
          <div class="text-[10px] font-black uppercase tracking-wider text-gray-500 mt-1">Rodadas</div>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <div class="text-2xl font-bebas text-emerald-400">{{ reportData.meta.total_partidas }}</div>
          <div class="text-[10px] font-black uppercase tracking-wider text-gray-500 mt-1">Partidas</div>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <div class="text-2xl font-bebas text-amber-400">{{ reportData.ranking.length }}</div>
          <div class="text-[10px] font-black uppercase tracking-wider text-gray-500 mt-1">No Ranking</div>
        </div>
      </div>

      <!-- Título e corte -->
      <div class="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex items-center gap-3">
        <span class="text-2xl">📊</span>
        <div>
          <div class="text-sm font-black text-white">{{ reportData.meta.campeonato_nome }}</div>
          <div class="text-xs text-gray-400 mt-0.5">
            {{ reportData.meta.apelido_grupo ? `📎 ${reportData.meta.apelido_grupo} · ` : '' }}
            {{ reportData.meta.ate_rodada === 'todas' ? 'Todas as rodadas' : `Até a Rodada ${reportData.meta.ate_rodada}` }}
            · Gerado em {{ formatDate(reportData.meta.gerado_em) }}
          </div>
        </div>
      </div>

      <!-- Botões de Exportação -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 class="text-sm font-black uppercase tracking-widest text-white">📤 Exportar Relatório</h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <!-- Excel Completo -->
          <button
            @click="exportExcel"
            :disabled="exportingExcel"
            class="group flex items-center gap-4 p-5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl transition-all active:scale-95 disabled:opacity-50 text-left cursor-pointer"
          >
            <div class="w-12 h-12 bg-emerald-500/20 group-hover:bg-emerald-500 rounded-xl flex items-center justify-center text-2xl transition-colors shrink-0">
              📊
            </div>
            <div>
              <div class="text-sm font-black text-white">Excel Completo</div>
              <div class="text-xs text-gray-400 mt-0.5">8 Abas · Dados detalhados e regras</div>
            </div>
            <span v-if="exportingExcel" class="ml-auto w-5 h-5 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin shrink-0" />
          </button>

          <!-- PDF Relatório -->
          <button
            @click="exportPDF"
            :disabled="exportingPDF"
            class="group flex items-center gap-4 p-5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-2xl transition-all active:scale-95 disabled:opacity-50 text-left cursor-pointer"
          >
            <div class="w-12 h-12 bg-red-500/20 group-hover:bg-red-500 rounded-xl flex items-center justify-center text-2xl transition-colors shrink-0">
              📄
            </div>
            <div>
              <div class="text-sm font-black text-white">PDF Relatório</div>
              <div class="text-xs text-gray-400 mt-0.5">8 Seções · Relatório Oficial Completo</div>
            </div>
            <span v-if="exportingPDF" class="ml-auto w-5 h-5 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin shrink-0" />
          </button>

          <!-- Snapshot JSON -->
          <button
            @click="exportJSON"
            :disabled="exportingJSON"
            class="group flex items-center gap-4 p-5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 rounded-2xl transition-all active:scale-95 disabled:opacity-50 text-left cursor-pointer"
          >
            <div class="w-12 h-12 bg-cyan-500/20 group-hover:bg-cyan-500 rounded-xl flex items-center justify-center text-2xl transition-colors shrink-0">
              💾
            </div>
            <div>
              <div class="text-sm font-black text-white">Snapshot JSON</div>
              <div class="text-xs text-gray-400 mt-0.5">Backup Bruto para Restauração (IA)</div>
            </div>
            <span v-if="exportingJSON" class="ml-auto w-5 h-5 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin shrink-0" />
          </button>

        </div>
      </div>

      <!-- Preview: Top 5 Ranking -->
      <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div class="px-6 py-4 border-b border-white/10">
          <h3 class="text-sm font-black uppercase tracking-widest text-white">🏆 Preview — Top 5 Ranking</h3>
        </div>
        <div class="divide-y divide-white/5">
          <div
            v-for="entry in reportData.ranking.slice(0, 5)"
            :key="entry.usuario_id"
            class="flex items-center justify-between px-6 py-4"
          >
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-xl flex items-center justify-center font-bebas text-lg shrink-0"
                :class="entry.position === 1 ? 'bg-yellow-500/20 text-yellow-400' : entry.position === 2 ? 'bg-gray-400/20 text-gray-300' : entry.position === 3 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-500'"
              >{{ entry.position }}º</span>
              <div>
                <div class="text-sm font-bold text-white">{{ entry.nome }}</div>
                <div class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{{ entry.time_nome || 'Sem Time' }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-bebas text-xl text-white">{{ entry.total_pontos }} <span class="text-xs text-gray-500">pts</span></div>
              <div class="text-[10px] text-gray-500">{{ entry.total_cravados }}🎯 · {{ entry.total_acertos }}✅</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Estado vazio -->
    <div v-else-if="!loading" class="py-20 text-center space-y-3 text-gray-600">
      <span class="text-6xl block opacity-30">📋</span>
      <p class="text-sm font-bold uppercase tracking-widest">Selecione um campeonato e clique em "Carregar Dados"</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  middleware: 'is-admin',
  layout: 'admin'
})

const supabase = useSupabaseClient<any>()
const toast = useToast()

// ── Estado ────────────────────────────────────────────────────────────────────
const campeonatos = ref<any[]>([])
const selectedCampId = ref('')
const ateRodada = ref<number | ''>('')
const maxRodadas = ref(38)
const loading = ref(false)
const exportingExcel = ref(false)
const exportingPDF = ref(false)
const exportingJSON = ref(false)
const reportData = ref<any>(null)

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    aprovado: 'Aprovado', pendente: 'Pendente', rejeitado: 'Rejeitado',
    finalizado: 'Finalizado', aberta: 'Aberta', fechada: 'Fechada', agendado: 'Agendado'
  }
  return map[status] || status
}

// ── Carregar campeonatos ──────────────────────────────────────────────────────
const fetchCampeonatos = async () => {
  const { data } = await supabase
    .from('campeonatos')
    .select('id, nome, apelido_grupo, max_rodadas, status')
    .order('created_at', { ascending: false })
  campeonatos.value = data || []
}

// ── Carregar dados do relatório ───────────────────────────────────────────────
const loadData = async () => {
  if (!selectedCampId.value) return
  loading.value = true
  reportData.value = null
  try {
    const camp = campeonatos.value.find(c => c.id === selectedCampId.value)
    maxRodadas.value = camp?.max_rodadas || 38

    const params = new URLSearchParams({ campeonato_id: selectedCampId.value })
    if (ateRodada.value !== '') params.set('ate_rodada_numero', String(ateRodada.value))

    const { data: { session } } = await supabase.auth.getSession()
    const data = await $fetch(`/api/admin/report?${params.toString()}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    reportData.value = data
    toast.success('Dados carregados com sucesso!')
  } catch (err: any) {
    toast.error('Erro ao carregar dados: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

// ── Export Excel ──────────────────────────────────────────────────────────────
const exportExcel = async () => {
  if (!reportData.value) return
  exportingExcel.value = true
  try {
    const xlsxMod = await import('xlsx')
    const XLSX = (xlsxMod as any).default || xlsxMod
    const wb = XLSX.utils.book_new()
    const d = reportData.value
    const meta = d.meta
    const ateStr = meta.ate_rodada === 'todas' ? 'Completo' : 'Ate_Rod' + meta.ate_rodada

    // ── Aba 1 — Ranking Geral
    const rodadaNums = [...new Set(d.partidas.map((p: any) => p.rodada_numero))].sort((a: any, b: any) => a - b)
    const rankRows = d.ranking.map((r: any) => {
      const row: any = {
        'Posição': r.position,
        'Participante': r.nome,
        'Email': r.email,
        'Time do Coração': r.time_nome || '-',
        'Pontos Totais': r.total_pontos,
        'Placares Exatos': r.total_cravados,
        'Acertos Vencedor': r.total_acertos,
        'Total Palpites': r.total_palpites || 0,
        'Cidade': r.cidade || '-',
        'Estado': r.estado || '-'
      }
      rodadaNums.forEach((n: any) => { row[`Rodada ${n}`] = r.pontos_por_rodada?.[n]?.pontos ?? 0 })
      return row
    })
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rankRows), 'Ranking')

    // ── Aba 2 — Partidas
    const partidaRows = d.partidas.map((p: any) => ({
      'ID Partida': p.id,
      'Rodada': p.rodada_numero,
      'Mandante': p.time_casa,
      'Visitante': p.time_fora,
      'Placar Real': p.placar_real,
      'Gols Casa': p.gols_casa ?? '',
      'Gols Fora': p.gols_fora ?? '',
      'Status': statusLabel(p.status),
      'Data da Partida': formatDate(p.data_partida),
      'Obrigatório': p.is_mandatory ? 'Sim' : 'Não',
      'Extra': p.is_extra ? 'Sim' : 'Não'
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(partidaRows), 'Partidas')

    // ── Aba 3 — Palpites Detalhados
    const palpiteRows = d.palpites_detalhados.map((p: any) => ({
      'Rodada': p.rodada_numero,
      'Participante': p.participante,
      'Email': p.participante_email || '-',
      'Jogo': p.jogo,
      'Mandante': p.time_casa,
      'Visitante': p.time_fora,
      'Palpite': p.palpite,
      'Palpite Gols Casa': p.gols_casa_bet,
      'Palpite Gols Fora': p.gols_fora_bet,
      'Placar Real': p.resultado_real,
      'Real Gols Casa': p.gols_casa_real ?? '',
      'Real Gols Fora': p.gols_fora_real ?? '',
      'Pontos': p.pontos,
      'Pontos c/ Mult': p.pontos_com_mult,
      'Tipo de Acerto': p.tipo_acerto,
      'Data do Palpite': formatDate(p.data_palpite)
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(palpiteRows), 'Palpites Detalhados')

    // ── Aba 4 — Palpites Especiais
    const especialRows = (d.palpites_especiais || []).map((e: any) => ({
      'Participante': e.participante,
      'Email': e.participante_email || '-',
      'Tipo de Palpite': e.tipo,
      'Escolha / Valor': e.valor,
      'Pontos': e.pontos,
      'Data do Palpite': formatDate(e.data_palpite)
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(especialRows), 'Palpites Especiais')

    // ── Aba 5 — Solicitações
    const solRows = d.solicitacoes.map((s: any) => ({
      'Nome': s.nome,
      'Email': s.email,
      'Status': statusLabel(s.status),
      'Cidade': s.cidade || '-',
      'Estado': s.estado || '-',
      'Telefone': s.telefone || '-',
      'Mensagem': s.mensagem || '-',
      'Motivo Rejeição': s.motivo_rejeicao || '-',
      'Solicitado em': formatDate(s.created_at),
      'Resolvido em': formatDate(s.resolved_at)
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(solRows), 'Solicitações')

    // ── Aba 6 — Rodadas
    const rodadasRows = d.rodadas.map((r: any) => ({
      'Rodada': r.numero_rodada,
      'Status': statusLabel(r.status),
      'Organizador': r.organizador,
      'Email Organizador': r.email_organizador,
      'Prazo Apostas': formatDate(r.betting_deadline),
      'Prazo Organizador': formatDate(r.organizer_deadline),
      'Multiplicador': r.multiplicador,
      'Total Partidas': r.total_partidas,
      'Partidas Finalizadas': r.partidas_finalizadas
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rodadasRows), 'Rodadas')

    // ── Aba 7 — Participantes
    const partRows = d.participantes.map((p: any) => ({
      'Nome': p.nome,
      'Email': p.email,
      'Cidade': p.cidade,
      'Estado': p.estado,
      'Time do Coração': p.time_coracao,
      'Membro desde': formatDate(p.membro_desde)
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(partRows), 'Participantes')

    // ── Aba 8 — Regras & Parâmetros
    const regrasRows = [
      { 'Parâmetro': 'Campeonato', 'Valor': meta.campeonato_nome },
      { 'Parâmetro': 'Apelido do Grupo', 'Valor': meta.apelido_grupo || '-' },
      { 'Parâmetro': 'Temporada (Season)', 'Valor': meta.season },
      { 'Parâmetro': 'Código da Competição', 'Valor': meta.api_code || '-' },
      { 'Parâmetro': 'Status Atual', 'Valor': meta.status },
      { 'Parâmetro': 'Fuso Horário', 'Valor': meta.fuso_horario || 'America/Sao_Paulo' },
      { 'Parâmetro': 'Data Início', 'Valor': formatDate(meta.start_date) },
      { 'Parâmetro': 'Data Fim', 'Valor': formatDate(meta.end_date) },
      { 'Parâmetro': 'Premiação', 'Valor': meta.detalhes_premiacao || '-' },
      { 'Parâmetro': 'Corte Histórico', 'Valor': meta.ate_rodada === 'todas' ? 'Todas as Rodadas' : `Até a Rodada ${meta.ate_rodada}` },
      { 'Parâmetro': 'Total Participantes no Corte', 'Valor': meta.total_participantes },
      { 'Parâmetro': 'Total Rodadas no Corte', 'Valor': meta.total_rodadas },
      { 'Parâmetro': 'Total Partidas no Corte', 'Valor': meta.total_partidas },
      { 'Parâmetro': 'Total Palpites no Corte', 'Valor': meta.total_palpites },
      { 'Parâmetro': 'Total Especiais no Corte', 'Valor': meta.total_especiais || 0 },
      { 'Parâmetro': 'Regra - Placar Exato (pts)', 'Valor': meta.regras_pontuacao?.placar_exato ?? 3 },
      { 'Parâmetro': 'Regra - Acertou Vencedor (pts)', 'Valor': meta.regras_pontuacao?.vencedor_correto ?? 1 },
      { 'Parâmetro': 'Regra - Erro (pts)', 'Valor': meta.regras_pontuacao?.errou ?? 0 },
      { 'Parâmetro': 'Snapshot Gerado em', 'Valor': formatDate(meta.gerado_em) }
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(regrasRows), 'Regras e Parâmetros')

    const safeName = `${meta.apelido_grupo || meta.campeonato_nome || 'Campeonato'}_${ateStr}`.replace(/[^a-zA-Z0-9_-]/g, '_')
    XLSX.writeFile(wb, `Relatorio_${safeName}.xlsx`)
    toast.success('✅ Excel Completo com 8 abas gerado com sucesso!')
  } catch (err: any) {
    console.error(err)
    toast.error('Erro ao gerar Excel: ' + err.message)
  } finally {
    exportingExcel.value = false
  }
}

// ── Export PDF ────────────────────────────────────────────────────────────────
const exportPDF = async () => {
  if (!reportData.value) return
  exportingPDF.value = true
  try {
    const jspdfModule = await import('jspdf')
    const jsPDF = (jspdfModule as any).default || jspdfModule
    const autoTableModule = await import('jspdf-autotable')
    const autoTable = (autoTableModule as any).default || autoTableModule
    const d = reportData.value
    const meta = d.meta
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const ateLabel = meta.ate_rodada === 'todas' ? 'Todas as rodadas' : 'Até a Rodada ' + meta.ate_rodada
    const rodadaNums = [...new Set(d.partidas.map((p: any) => p.rodada_numero))].sort((a: any, b: any) => a - b)

    const addHeader = (title: string) => {
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pageW, 22, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text(`+BET — ${meta.apelido_grupo || meta.campeonato_nome} | ${title}`, 14, 10)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.text(`Corte: ${ateLabel} | Gerado em: ${formatDate(meta.gerado_em)} | Temporada: ${meta.season}`, 14, 17)
      doc.setTextColor(0, 0, 0)
    }

    // ── 1. Ranking Geral
    addHeader('RANKING GERAL')
    const rankCols = [
      { header: '#', dataKey: 'pos' },
      { header: 'Participante', dataKey: 'nome' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Time', dataKey: 'time' },
      { header: 'Pts', dataKey: 'pts' },
      { header: 'Exatos', dataKey: 'crav' },
      { header: 'Vencedor', dataKey: 'acert' },
      ...rodadaNums.map((n: any) => ({ header: `R` + n, dataKey: `r` + n }))
    ]
    const rankRows = d.ranking.map((r: any) => {
      const row: any = {
        pos: r.position,
        nome: r.nome,
        email: r.email || '-',
        time: r.time_nome || '-',
        pts: r.total_pontos,
        crav: r.total_cravados,
        acert: r.total_acertos
      }
      rodadaNums.forEach((n: any) => { row[`r${n}`] = r.pontos_por_rodada?.[n]?.pontos ?? 0 })
      return row
    })
    autoTable(doc, {
      startY: 26,
      margin: { top: 26, bottom: 12 },
      columns: rankCols,
      body: rankRows,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      didDrawPage: () => addHeader('RANKING GERAL')
    })

    // ── 2. Partidas e Placares
    doc.addPage()
    addHeader('PARTIDAS E PLACARES')
    autoTable(doc, {
      startY: 26,
      margin: { top: 26, bottom: 12 },
      columns: [
        { header: 'Rodada', dataKey: 'rod' },
        { header: 'Mandante', dataKey: 'casa' },
        { header: 'Visitante', dataKey: 'fora' },
        { header: 'Placar Real', dataKey: 'placar' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Data', dataKey: 'data' }
      ],
      body: d.partidas.map((p: any) => ({
        rod: 'Rod. ' + p.rodada_numero,
        casa: p.time_casa,
        fora: p.time_fora,
        placar: p.placar_real,
        status: statusLabel(p.status),
        data: formatDate(p.data_partida)
      })),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      didDrawPage: () => addHeader('PARTIDAS E PLACARES')
    })

    // ── 3. Palpites Detalhados
    if (d.palpites_detalhados && d.palpites_detalhados.length > 0) {
      doc.addPage()
      addHeader('PALPITES DETALHADOS')
      autoTable(doc, {
        startY: 26,
        margin: { top: 26, bottom: 12 },
        columns: [
          { header: 'Rod.', dataKey: 'rod' },
          { header: 'Participante', dataKey: 'nome' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Confronto', dataKey: 'jogo' },
          { header: 'Palpite', dataKey: 'palpite' },
          { header: 'Real', dataKey: 'real' },
          { header: 'Pts', dataKey: 'pontos' },
          { header: 'Tipo Acerto', dataKey: 'acerto' }
        ],
        body: d.palpites_detalhados.map((p: any) => ({
          rod: 'R' + p.rodada_numero,
          nome: p.participante,
          email: p.participante_email || '-',
          jogo: p.jogo,
          palpite: p.palpite,
          real: p.resultado_real,
          pontos: p.pontos_com_mult,
          acerto: p.tipo_acerto
        })),
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        didDrawPage: () => addHeader('PALPITES DETALHADOS')
      })
    }

    // ── 4. Palpites Especiais
    if (d.palpites_especiais && d.palpites_especiais.length > 0) {
      doc.addPage()
      addHeader('PALPITES ESPECIAIS')
      autoTable(doc, {
        startY: 26,
        margin: { top: 26, bottom: 12 },
        columns: [
          { header: 'Participante', dataKey: 'nome' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Tipo de Palpite', dataKey: 'tipo' },
          { header: 'Escolha / Valor', dataKey: 'valor' },
          { header: 'Pontos', dataKey: 'pontos' },
          { header: 'Data do Palpite', dataKey: 'data' }
        ],
        body: d.palpites_especiais.map((e: any) => ({
          nome: e.participante,
          email: e.participante_email || '-',
          tipo: e.tipo,
          valor: e.valor,
          pontos: e.pontos,
          data: formatDate(e.data_palpite)
        })),
        theme: 'striped',
        headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5 },
        didDrawPage: () => addHeader('PALPITES ESPECIAIS')
      })
    }

    // ── 5. Rodadas e Organizadores
    if (d.rodadas && d.rodadas.length > 0) {
      doc.addPage()
      addHeader('RODADAS E ORGANIZADORES')
      autoTable(doc, {
        startY: 26,
        margin: { top: 26, bottom: 12 },
        columns: [
          { header: 'Rodada', dataKey: 'rod' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Organizador', dataKey: 'org' },
          { header: 'Email Organizador', dataKey: 'email' },
          { header: 'Prazo Apostas', dataKey: 'prazo' },
          { header: 'Mult.', dataKey: 'mult' },
          { header: 'Partidas', dataKey: 'total' }
        ],
        body: d.rodadas.map((r: any) => ({
          rod: 'Rodada ' + r.numero_rodada,
          status: statusLabel(r.status),
          org: r.organizador,
          email: r.email_organizador || '-',
          prazo: formatDate(r.betting_deadline),
          mult: r.multiplicador + 'x',
          total: `${r.partidas_finalizadas}/${r.total_partidas}`
        })),
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5 },
        didDrawPage: () => addHeader('RODADAS E ORGANIZADORES')
      })
    }

    // ── 6. Participantes do Bolão
    if (d.participantes && d.participantes.length > 0) {
      doc.addPage()
      addHeader('PARTICIPANTES DO BOLÃO')
      autoTable(doc, {
        startY: 26,
        margin: { top: 26, bottom: 12 },
        columns: [
          { header: 'Nome', dataKey: 'nome' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Time do Coração', dataKey: 'time' },
          { header: 'Cidade / UF', dataKey: 'local' },
          { header: 'Membro Desde', dataKey: 'data' }
        ],
        body: d.participantes.map((p: any) => ({
          nome: p.nome,
          email: p.email,
          time: p.time_coracao || '-',
          local: `${p.cidade || '-'} / ${p.estado || '-'}`,
          data: formatDate(p.membro_desde)
        })),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5 },
        didDrawPage: () => addHeader('PARTICIPANTES DO BOLÃO')
      })
    }

    // ── 7. Solicitações de Acesso
    if (d.solicitacoes && d.solicitacoes.length > 0) {
      doc.addPage()
      addHeader('SOLICITAÇÕES DE ACESSO')
      autoTable(doc, {
        startY: 26,
        margin: { top: 26, bottom: 12 },
        columns: [
          { header: 'Nome', dataKey: 'nome' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Cidade / UF', dataKey: 'local' },
          { header: 'Solicitado em', dataKey: 'data' }
        ],
        body: d.solicitacoes.map((s: any) => ({
          nome: s.nome,
          email: s.email,
          status: statusLabel(s.status),
          local: `${s.cidade || '-'} / ${s.estado || '-'}`,
          data: formatDate(s.created_at)
        })),
        theme: 'striped',
        headStyles: { fillColor: [244, 63, 94], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5 },
        didDrawPage: () => addHeader('SOLICITAÇÕES DE ACESSO')
      })
    }

    // ── 8. Configurações e Regras
    doc.addPage()
    addHeader('REGRAS E CONFIGURAÇÕES')
    autoTable(doc, {
      startY: 26,
      margin: { top: 26, bottom: 12 },
      columns: [
        { header: 'Parâmetro', dataKey: 'param' },
        { header: 'Valor / Configuração', dataKey: 'val' }
      ],
      body: [
        { param: 'Campeonato', val: meta.campeonato_nome },
        { param: 'Apelido do Grupo', val: meta.apelido_grupo || '-' },
        { param: 'Temporada (Season)', val: String(meta.season) },
        { param: 'Código da Competição', val: meta.api_code || '-' },
        { param: 'Status Atual', val: meta.status },
        { param: 'Fuso Horário', val: meta.fuso_horario || 'America/Sao_Paulo' },
        { param: 'Período', val: `${formatDate(meta.start_date)} até ${formatDate(meta.end_date)}` },
        { param: 'Corte Histórico', val: meta.ate_rodada === 'todas' ? 'Todas as Rodadas' : `Até a Rodada ${meta.ate_rodada}` },
        { param: 'Total Participantes no Corte', val: String(meta.total_participantes) },
        { param: 'Total Rodadas no Corte', val: String(meta.total_rodadas) },
        { param: 'Total Partidas no Corte', val: String(meta.total_partidas) },
        { param: 'Total Palpites no Corte', val: String(meta.total_palpites) },
        { param: 'Pontuação - Placar Exato', val: `${meta.regras_pontuacao?.placar_exato ?? 3} pontos` },
        { param: 'Pontuação - Acertou Vencedor', val: `${meta.regras_pontuacao?.vencedor_correto ?? 1} ponto` },
        { param: 'Pontuação - Erro', val: `${meta.regras_pontuacao?.errou ?? 0} pontos` },
        { param: 'Premiação', val: meta.detalhes_premiacao || 'Não informada' },
        { param: 'Gerado em', val: formatDate(meta.gerado_em) }
      ],
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      didDrawPage: () => addHeader('REGRAS E CONFIGURAÇÕES')
    })

    const ateStr = meta.ate_rodada === 'todas' ? 'Completo' : 'Ate_Rod' + meta.ate_rodada
    const safeName = `${meta.apelido_grupo || meta.campeonato_nome || 'Campeonato'}_${ateStr}`.replace(/[^a-zA-Z0-9_-]/g, '_')
    doc.save(`Relatorio_${safeName}.pdf`)
    toast.success('✅ PDF Completo com todas as seções gerado com sucesso!')
  } catch (err: any) {
    console.error(err)
    toast.error('Erro ao gerar PDF: ' + err.message)
  } finally {
    exportingPDF.value = false
  }
}
// ── Export Snapshot JSON ──────────────────────────────────────────────────────
const exportJSON = () => {
  if (!reportData.value) return
  exportingJSON.value = true
  try {
    const d = reportData.value
    const meta = d.meta
    const ateStr = meta.ate_rodada === 'todas' ? 'Completo' : 'Ate_Rod' + meta.ate_rodada
    const safeName = `${meta.apelido_grupo || meta.campeonato_nome || 'Campeonato'}_${ateStr}`.replace(/[^a-zA-Z0-9_-]/g, '_')

    const jsonStr = JSON.stringify(d, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Snapshot_Backup_+BET_${safeName}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    toast.success('💾 Snapshot JSON de backup exportado com sucesso!')
  } catch (err: any) {
    console.error(err)
    toast.error('Erro ao gerar JSON: ' + err.message)
  } finally {
    exportingJSON.value = false
  }
}

onMounted(fetchCampeonatos)

useHead({
  title: '+BET Admin | Relatórios',
  meta: [{ name: 'description', content: 'Exporte relatórios completos do bolão em PDF e Excel.' }]
})
</script>
