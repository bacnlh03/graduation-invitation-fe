import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Users, LogOut, GraduationCap } from 'lucide-react'
import clsx from 'clsx'
import { useAuthStore } from '@/stores/useAuthStore'

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  
  const isActive = (path: string) => location.pathname === path 
    ? 'bg-white/10 text-white' 
    : 'text-slate-400 hover:text-white hover:bg-white/5'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col hidden md:flex shrink-0 h-screen sticky top-0 z-[100]">
      {/* Brand header */}
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-white font-bold text-base leading-tight tracking-tight">Thiệp tốt nghiệp</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 space-y-1 flex-1">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">Quản lý</p>
        <Link 
          to="/" 
          className={clsx("flex items-center gap-3 py-2.5 px-3 rounded-lg font-medium transition-all text-sm", isActive('/'))}
        >
          <Users size={17}/> Khách mời
        </Link>

        <Link 
          to="/design" 
          className={clsx("flex items-center gap-3 py-2.5 px-3 rounded-lg font-medium transition-all text-sm", isActive('/design'))}
        >
          <GraduationCap size={17} /> Thiết kế thiệp
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={17} /> Đăng xuất
        </button>
        <p className="text-[10px] text-slate-700 text-center leading-relaxed">
          v1.0 &nbsp;·&nbsp; © 2025 Kenyo &amp; Mei
        </p>
      </div>
    </aside>
  )
}
