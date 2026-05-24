import { useState } from 'react'
import { UserButton } from '@clerk/clerk-react'
import { useReminders } from '../hooks/useReminders'
import { useCurrentUser } from '../hooks/useUsers'

export default function TopBar({ onMenuClick }) {
  const { data: reminders } = useReminders()
  const { data: currentUser } = useCurrentUser()
  const [showReminders, setShowReminders] = useState(false)

  const dueCount = (reminders?.dueToday?.length || 0) + (reminders?.overdue?.length || 0)

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-xl text-gray-600 hover:text-gray-900 lg:hidden">
          &#9776;
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">{currentUser?.company || 'SalesOps'}</h1>
          <p className="text-xs text-gray-500 capitalize">{currentUser?.name} &middot; {currentUser?.role}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowReminders(!showReminders)}
            className="relative text-xl text-gray-600 hover:text-gray-900"
          >
            &#128276;
            {dueCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {dueCount > 9 ? '9+' : dueCount}
              </span>
            )}
          </button>
          {showReminders && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowReminders(false)} />
              <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="max-h-96 overflow-y-auto p-3 space-y-3">
                  {reminders?.overdue?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-1 uppercase">Overdue</p>
                      {reminders.overdue.map((t) => (
                        <div key={t._id} className="rounded bg-red-50 p-2 text-sm">
                          <p className="font-medium text-gray-800">{t.title}</p>
                          <p className="text-xs text-gray-500">Due {new Date(t.dueDate).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {reminders?.dueToday?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-orange-600 mb-1 uppercase">Due Today</p>
                      {reminders.dueToday.map((t) => (
                        <div key={t._id} className="rounded bg-orange-50 p-2 text-sm">
                          <p className="font-medium text-gray-800">{t.title}</p>
                          <p className="text-xs text-gray-500">{t.leadId?.companyName || 'No lead'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {reminders?.upcoming?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-blue-600 mb-1 uppercase">Next 3 Days</p>
                      {reminders.upcoming.map((t) => (
                        <div key={t._id} className="rounded bg-blue-50 p-2 text-sm">
                          <p className="font-medium text-gray-800">{t.title}</p>
                          <p className="text-xs text-gray-500">Due {new Date(t.dueDate).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {!reminders?.overdue?.length && !reminders?.dueToday?.length && !reminders?.upcoming?.length && (
                    <p className="text-sm text-gray-400 text-center py-4">No pending tasks</p>
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
