import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Publishable key (sb_publishable_...) thay thế anon key; hỗ trợ cả hai tên env
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_PUBLISHABLE_KEY. Cấu hình trong .env (xem .env.example).'
  )
}

export const supabase = createClient<Database>(supabaseUrl ?? '', supabaseKey ?? '')

export const INVITATION_ASSETS_BUCKET = 'invitation-assets'
