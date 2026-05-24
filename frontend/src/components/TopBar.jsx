import { UserButton } from '@clerk/clerk-react'

export default function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-800">Manufacturing SalesOps</h1>
      <div className="flex items-center gap-4">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  )
}
