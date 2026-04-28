// shared/types/Usuario.ts
import type { Time } from './Time'

export interface Usuario {
  id: string
  nome: string
  email: string
  is_admin: boolean
  time_id: string | null
  created_at: string
  // Relação opcional (join)
  time?: Time
}
