import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const TITLES = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/tasks': 'Tasks',
  '/quotations': 'Quotations',
  '/users': 'Users',
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const location = useLocation()
  useDocumentTitle(TITLES[location.pathname])

  return (
    // Use 100dvh (dynamic viewport height) on mobile so the URL bar's
    // appearance/disappearance doesn't clip the layout. On larger
    // screens, h-screen keeps the sidebar pinned.
    <div className="flex h-screen min-h-[100dvh] bg-gray-50/70">
      <Sidebar
        open={sidebarOpen}
        collapsed={!sidebarVisible}
        onClose={() => setSidebarOpen(false)}
        onToggleSidebar={() => setSidebarVisible((v) => !v)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)] lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
