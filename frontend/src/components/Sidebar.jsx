import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/leads', label: 'Leads', icon: '🎯' },
  { to: '/tasks', label: 'Tasks', icon: '✅' },
  { to: '/quotations', label: 'Quotations', icon: '📄' },
  { to: '/users', label: 'Users', icon: '👥' },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <SidebarContent />
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={onClose} />
          <aside className="relative flex w-64 flex-col bg-white h-full">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏭</span>
                <span className="font-bold text-gray-800">SalesOps</span>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl leading-none">&times;</button>
            </div>
            <SidebarContent onClick={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}

function SidebarContent({ onClick }) {
  return (
    <nav className="flex-1 space-y-1 p-4">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === '/'}
          onClick={onClick}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <span>{link.icon}</span>
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
