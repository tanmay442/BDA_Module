import { useLocation, Link } from 'react-router-dom'
import { Menu01 } from '@untitledui/icons'
import { SidebarNavigationSectionDividers } from './application/app-navigation/sidebar-navigation/sidebar-section-dividers'
import { appNavItems } from './application/app-navigation/app-nav-config'

export default function Sidebar({ open, onClose, onToggleSidebar, collapsed }) {
  const location = useLocation()

  return (
    <>
      <aside className={`hidden flex-col border-r border-border-secondary backdrop-blur-sm lg:flex h-screen bg-white/70 ${collapsed ? 'w-12 items-center pt-4' : 'w-52'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onToggleSidebar}
              className="flex size-9 items-center justify-center rounded-lg text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover"
            >
              <Menu01 className="size-5" />
            </button>
            <div className="mt-4 flex flex-col items-center gap-0.5">
              {appNavItems.filter((i) => !i.divider).map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.href || item.label}
                    to={item.href || '#'}
                    className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? 'bg-secondary text-fg-quaternary_hover'
                        : 'text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover'
                    }`}
                  >
                    {Icon && <Icon className="size-5" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-start px-3 pt-4 pb-2 shrink-0">
              <button
                onClick={onToggleSidebar}
                className="flex size-9 items-center justify-center rounded-lg text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover"
              >
                <Menu01 className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNavigationSectionDividers items={appNavItems} />
            </div>
          </>
        )}
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={onClose} />
          <aside className="relative flex w-64 flex-col bg-white/80 backdrop-blur-sm h-full">
            <div className="flex items-center justify-start px-3 pt-4 pb-2 shrink-0">
              <button
                onClick={onClose}
                className="flex size-9 items-center justify-center rounded-lg text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover"
              >
                <Menu01 className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNavigationSectionDividers items={appNavItems} />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
