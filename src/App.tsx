import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/ui/Sidebar'
import { GuestsPage } from './pages/GuestsPage'
import { InvitationPage } from './pages/InvitationPage'
import { DesignerPage } from './pages/DesignerPage'
import { LoginPage } from './pages/LoginPage'
import { ToastNotification } from './components/ui/ToastNotification'
import { ProtectedRoute } from './components/ui/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen w-full bg-slate-50">
        <Routes>
          {/* Public routes — no sidebar, no auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invitation" element={<InvitationPage />} />

          {/* Protected admin routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          } />
        </Routes>
        <ToastNotification />
      </div>
    </BrowserRouter>
  )
}

function AdminLayout() {
  return (
    <div className="flex w-full min-h-screen">
      <Sidebar />
      <main className="flex-1 w-full relative">
        <Routes>
          <Route path="/" element={<GuestsPage />} />
          <Route path="/design" element={<DesignerPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
