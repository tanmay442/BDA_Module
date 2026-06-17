import { useState } from 'react'
import { UserButton } from '@clerk/clerk-react'
import { Menu01, Bell01 } from '@untitledui/icons'
import { useReminders } from '../hooks/useReminders'
import { useCurrentUser } from '../hooks/useUsers'
import { ManufacturingLogo } from './foundations/logo/manufacturing-logo'

export default function TopBar({ onMenuClick }) {
  const { data: reminders } = useReminders()
  const { data: currentUser } = useCurrentUser()
  const [showReminders, setShowReminders] = useState(false)

  const dueCount = (reminders?.dueToday?.length || 0) + (reminders?.overdue?.length || 0)
  const upcomingCount = reminders?.upcoming?.length || 0

  return (
    <header className="flex h-16 items-center justify-between border-b border-border-secondary bg-primary px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex size-9 items-center justify-center rounded-lg text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover lg:hidden"
        >
          <Menu01 className="size-5" />
        </button>
        <ManufacturingLogo className="hidden sm:block" />
        <div>
          <h1 className="text-sm font-semibold text-secondary">{currentUser?.company || 'SalesOps'}</h1>
          <p className="text-xs text-tertiary capitalize">{currentUser?.name} &middot; {currentUser?.role}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowReminders(!showReminders)}
              className="relative flex size-9 items-center justify-center rounded-lg text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover"
            >
              <Bell01 className="size-5" />
              {dueCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {dueCount > 9 ? '9+' : dueCount}
                </span>
              )}
            </button>
            {upcomingCount > 0 && (
              <span className="mt-0.5 text-[10px] text-fg-quaternary">
                {upcomingCount} upcoming
              </span>
            )}
          </div>
          {showReminders && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowReminders(false)} />
              <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-2xl">
                <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  {reminders?.overdue?.length > 0 && (
                    <div>
                      <p className="px-3 pt-3 pb-1 text-xs font-semibold text-red-600 uppercase">Overdue</p>
                      {reminders.overdue.map((t) => (
                        <div key={t._id} className="border-l-4 border-red-500 bg-white p-3 hover:bg-gray-50">
                          <p className="text-sm font-medium text-gray-800">{t.title}</p>
                          <p className="text-xs text-gray-500">Due {new Date(t.dueDate).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {reminders?.dueToday?.length > 0 && (
                    <div>
                      <p className="px-3 pt-3 pb-1 text-xs font-semibold text-yellow-600 uppercase">Due Today</p>
                      {reminders.dueToday.map((t) => (
                        <div key={t._id} className="border-l-4 border-yellow-400 bg-white p-3 hover:bg-gray-50">
                          <p className="text-sm font-medium text-gray-800">{t.title}</p>
                          <p className="text-xs text-gray-500">{t.leadId?.companyName || 'No lead'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {reminders?.upcoming?.length > 0 && (
                    <div>
                      <p className="px-3 pt-3 pb-1 text-xs font-semibold text-blue-600 uppercase">Next 3 Days</p>
                      {reminders.upcoming.map((t) => (
                        <div key={t._id} className="border-l-4 border-blue-400 bg-white p-3 hover:bg-gray-50">
                          <p className="text-sm font-medium text-gray-800">{t.title}</p>
                          <p className="text-xs text-gray-500">Due {new Date(t.dueDate).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {!reminders?.overdue?.length && !reminders?.dueToday?.length && !reminders?.upcoming?.length && (
                    <p className="py-6 text-center text-sm text-gray-400">No pending tasks</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  )
}
