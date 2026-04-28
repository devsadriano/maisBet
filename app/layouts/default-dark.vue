<!--
==============================================================================
  +BET — Layout de Referência DARK MODE
  Arquivo: default-dark.vue
==============================================================================

  Este arquivo serve como GUIA DE REFERÊNCIA para criar novas telas no
  visual dark do +BET. Não contém lógica; use o default.vue para produção.

  ── TOKENS DE COR ─────────────────────────────────────────────────────────
  Todos definidos em main.css. Use sempre via CSS var() ou Tailwind:

  Backgrounds:
    bg-[var(--bg-base)]          → #0d0d0d  (fundo principal)
    bg-[var(--bg-surface)]       → #161616  (cards primários)
    bg-[var(--bg-surface-2)]     → #1e1e1e  (cards secundários, dropdowns)
    bg-[var(--bg-surface-3)]     → #2a2a2a  (inputs, divisores)

  Texto:
    text-[var(--text-primary)]   → #f1f5f9  (títulos, labels)
    text-[var(--text-secondary)] → #cbd5e1  (subtítulos)
    text-[var(--text-muted)]     → #64748b  (texto de apoio)

  Bordas:
    border-[var(--border)]       → rgba(255,255,255,0.07)
    border-[var(--border-strong)]→ rgba(255,255,255,0.14)

  Acento Principal (Verde Neon):
    text-[var(--brand)]          → #00e87a  (labels, ícones ativos)
    bg-[var(--brand-dim)]        → rgba(0,232,122,0.12) (fundo suave)
    border-[color:var(--brand)]  → borda verde

  Dourado (Ranking):
    text-[var(--gold)]           → #facc15
    bg-[var(--gold-dim)]         → rgba(250,204,21,0.12)

  Perigo:
    text-[var(--danger)]         → #f87171
    bg-[var(--danger-dim)]       → rgba(248,113,113,0.12)

  ── PADRÕES DE COMPONENTE ─────────────────────────────────────────────────

  Card padrão:
  <div class="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[2.5rem] p-8">

  Card com destaque verde (active, selecionado):
  <div class="bg-[var(--brand-dim)] border border-[color:var(--brand)] border-opacity-30 rounded-[2.5rem] p-8">

  Input/Campo:
  <input class="bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-primary)]
                placeholder:text-[var(--text-muted)] rounded-xl px-4 py-3 focus:border-[color:var(--brand)]
                outline-none transition-colors" />

  Label de categoria:
  <span class="text-[8px] font-black uppercase tracking-widest text-[var(--brand)]">

  Título de seção:
  <h2 class="text-xl font-bebas tracking-widest text-[var(--text-primary)]">

  Divisor:
  <div class="h-px w-full bg-[var(--border)]" />

  Badge ativo:
  <BaseBadge variant="brand">Texto</BaseBadge>

  Botão principal:
  <BaseButton variant="brand">Ação</BaseButton>

  Link de atalho hover:
  <div class="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl
              hover:bg-[var(--brand-dim)] hover:border-[color:var(--brand)]
              transition-all duration-300">

  ── GRADIENTES ESPECIAIS ──────────────────────────────────────────────────

  Fundo de ranking (igual às imagens de referência):
  background: radial-gradient(ellipse at 70% 50%, rgba(0,80,40,0.5) 0%, transparent 60%),
              radial-gradient(ellipse at 30% 50%, rgba(80,80,0,0.3) 0%, transparent 60%),
              #0d0d0d;

  Glow circular de avatar (1º lugar):
  box-shadow: 0 0 0 3px var(--brand), 0 0 30px var(--brand-glow);

  Glow circular de avatar (2º lugar — dourado):
  box-shadow: 0 0 0 3px var(--gold), 0 0 25px rgba(250,204,21,0.35);

==============================================================================
-->

<template>
  <!--
    Exemplo de estrutura de página usando os tokens dark.
    Para uso real, substituir por default.vue (que já tem o toggle automático).
  -->
  <div class="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
    <!-- Conteúdo da página aqui -->
    <slot />
  </div>
</template>

<script setup lang="ts">
// Este layout de referência força sempre o dark mode para fins de preview.
// Na produção, use o default.vue que gerencia os dois modos automaticamente.
if (process.client) {
  document.documentElement.classList.add('dark')
}
</script>
