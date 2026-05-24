import { UserButton } from '@clerk/clerk-react'

export default function TopBar({ onMenuClick }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-xl text-gray-600 hover:text-gray-900 lg:hidden">
          &#9776;
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Manufacturing SalesOps</h1>
      </div>
      <div className="flex items-center gap-4">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  )
}
