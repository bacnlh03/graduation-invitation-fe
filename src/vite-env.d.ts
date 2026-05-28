/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  /** Khuyến nghị — key mới (sb_publishable_...) */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  /** Legacy — JWT anon key, vẫn dùng được nếu project chưa migrate */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
