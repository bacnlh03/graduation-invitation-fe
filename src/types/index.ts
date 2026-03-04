export interface Guest {
  id: string
  full_name: string
  status: number // 0=Chưa gửi, 1=Đã gửi, 2=Xác nhận
  updated_at: string
}

export interface GuestFilter {
  search: string
  status: string // 'all' | '0' | '1' | '2'
}

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  show: boolean
  message: string
  type: ToastType
}
