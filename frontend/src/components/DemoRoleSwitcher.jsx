import { useState } from 'react'
import { useCurrentUser, useDemoSwitchRole } from '../hooks/useUsers'
import { useQueryClient } from '@tanstack/react-query'
import { Sparkles, X, ChevronDown } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'bda', label: 'BDA', desc: 'Sales agent' },
  { value: 'manager', label: 'Manager', desc: 'Team lead' },
  { value: 'admin', label: 'Admin', desc: 'Full access' },
]

export default function DemoRoleSwitcher() {
  const enabled = import.meta.env.VITE_ALLOW_DEMO_SWITCH === 'true'
  const { data: currentUser } = useCurrentUser()
  const switchRole = useDemoSwitchRole()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  if (!enabled) return null

  const currentRole = currentUser?.role
  const currentLabel = ROLE_OPTIONS.find((r) => r.value === currentRole)?.label || 'Role'

  const handleSelect = async (targetRole) => {
    if (targetRole === currentRole) {
      setOpen(false)
      return
    }
    setPending(true)
    try {
      await switchRole.mutateAsync({ targetRole })
      await qc.invalidateQueries()
    } catch (err) {
      console.error('Demo role switch failed:', err)
    } finally {
      setPending(false)
      setOpen(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-12 right-0 z-50 w-64 rounded-xl border border-purple-200 bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
              <Sparkles className="size-3.5 text-purple-500" />
              <p className="text-xs font-semibold text-gray-700">Demo: Switch role</p>
            </div>
            <div className="p-2">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  disabled={pending}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    currentRole === opt.value
                      ? 'bg-purple-50 text-purple-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  } disabled:opacity-50`}
                >
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                  {currentRole === opt.value && (
                    <span className="text-xs font-semibold text-purple-600">active</span>
                  )}
                </button>
              ))}
            </div>
            <p className="border-t border-gray-100 px-3 py-2 text-[10px] text-gray-400">
              Only enabled in demo builds (VITE_ALLOW_DEMO_SWITCH=true)
            </p>
          </div>
        </>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-purple-200 bg-white/90 px-4 py-2 text-sm font-medium text-purple-700 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl hover:bg-purple-50"
        title="Demo: switch role"
      >
        <Sparkles className="size-4 text-purple-500" />
        <span>Demo: {currentLabel}</span>
        {open ? <X className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>
    </div>
  )
}
