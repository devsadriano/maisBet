export type NotificationCategory =
  | 'organizer_alerts'
  | 'round_alerts'
  | 'deadline_reminders'
  | 'results_alerts'
  | 'system'

export interface PushPayload {
  title: string
  message: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
}

export interface NotificationPreferences {
  user_id: string
  push_enabled: boolean
  organizer_alerts: boolean
  round_alerts: boolean
  deadline_reminders: boolean
  results_alerts: boolean
  updated_at?: string
}

export interface PushSubscriptionInput {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  device_label?: string
}

export interface UserNotification {
  id: string
  user_id: string
  category: NotificationCategory
  title: string
  message: string
  url: string
  read_at: string | null
  created_at: string
}

