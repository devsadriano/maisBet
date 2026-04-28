// shared/constants/scoring.ts
//
// ⚠️  CONTRATO DE PONTUAÇÃO — FONTE DE REFERÊNCIA
// Estas constantes definem as regras de pontuação do +BET.
//
// O cálculo real ocorre no banco de dados via trigger SQL `trg_calcular_pontos`
// (function public.calcular_pontos). Qualquer alteração nos valores abaixo
// DEVE ser replicada manualmente no trigger para manter consistência.
//
// Nunca calcule pontos em código TypeScript no servidor/cliente —
// use estas constantes apenas para exibição e validação no frontend.

/** Pontos ganhos por tipo de acerto */
export const SCORING = {
  /** Placar cravado exato (ex: apostou 2x1, saiu 2x1) */
  EXACT_SCORE: 3,
  /** Resultado correto (acertou quem vence ou empate, mas errou o placar) */
  CORRECT_RESULT: 1,
  /** Erro ou partida adiada */
  MISS: 0,
} as const

/** Número máximo de jogos por rodada (obrigatórios + extras) */
export const MAX_MATCHES_PER_ROUND = 7

/** Número de jogos extras que o organizador escolhe por rodada */
export const EXTRA_MATCHES_COUNT = 2

/** Horas antes do 1º jogo para bloquear escolha do organizador */
export const ORGANIZER_DEADLINE_HOURS = 12

/** Horas antes do 1º jogo para bloquear palpites dos jogadores */
export const BETTING_DEADLINE_HOURS = 1
