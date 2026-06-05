import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useRouteTitle } from '../hooks/useDocumentTitle'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  useRouteTitle()

  return (
    <div className="flex h-screen bg-gray-50/70">
      <Sidebar
        open={sidebarOpen}
        collapsed={!sidebarVisible}
        onClose={() => setSidebarOpen(false)}
        onToggleSidebar={() => setSidebarVisible((v) => !v)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
