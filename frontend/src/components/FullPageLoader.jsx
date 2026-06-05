import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Logo } from './foundations/logo/logo'

export function FullPageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Logo className="h-8 w-8 animate-pulse" />
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <span>{label}</span>
        </div>
      </div>
    </div>
  )
}
