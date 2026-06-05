import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Logo } from '../components/foundations/logo/logo'

const GITHUB_URL = 'https://github.com/tanmay442'
const REPO_URL = 'https://github.com/tanmay442/BDA_Module'

function GitHubIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

export default function SignInPage() {
  return (
    <>
      <SignedIn>
        <Navigate to="/" replace />
      </SignedIn>
      <SignedOut>
        <div className="flex h-screen flex-col overflow-hidden bg-white text-gray-900">
          <header className="h-16 shrink-0 border-b border-gray-100">
            <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <Logo className="h-7 w-7" />
                <span className="text-sm font-semibold tracking-tight">SalesOps</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden text-xs text-gray-400 sm:inline">
                  Personal full-stack project
                </span>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 transition hover:text-gray-900"
                >
                  <GitHubIcon className="h-3.5 w-3.5" />
                  <span>tanmay442</span>
                </a>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            <div className="mx-auto grid h-full max-w-6xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-2 lg:gap-12 lg:py-10">
              <section className="flex min-h-0 flex-col justify-center">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  Manufacturing sales, organised
                </p>
                <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
                  A sales-ops dashboard for manufacturing teams.
                </h1>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600">
                  A personal full-stack project that takes a manufacturing enquiry
                  from a first website form all the way to a signed quotation
                  and a closed deal, in one place.
                </p>

                <ul className="mt-5 grid gap-2 text-sm text-gray-700">
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-900" />
                    <span>
                      <span className="font-medium text-gray-900">Lead pipeline</span>
                      <span className="text-gray-500"> &middot; drag-and-drop kanban across 7 stages</span>
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-900" />
                    <span>
                      <span className="font-medium text-gray-900">Quotations</span>
                      <span className="text-gray-500"> &middot; itemised with MOQ, versioning, PDF export</span>
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-900" />
                    <span>
                      <span className="font-medium text-gray-900">Tasks, activity, reminders</span>
                      <span className="text-gray-500"> &middot; with due-today and overdue alerts</span>
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-900" />
                    <span>
                      <span className="font-medium text-gray-900">Role-based views</span>
                      <span className="text-gray-500"> &middot; manager sees the team, BDA sees their own</span>
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-900" />
                    <span>
                      <span className="font-medium text-gray-900">Real-time sync</span>
                      <span className="text-gray-500"> &middot; Pusher delivers live updates without polling</span>
                    </span>
                  </li>
                </ul>

                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700">
                    Sign in as <span className="font-medium">Manager</span> &middot; full team view
                  </span>
                  <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700">
                    Sign in as <span className="font-medium">BDA</span> &middot; your own pipeline
                  </span>
                </div>

                <p className="mt-5 max-w-md text-[11px] leading-relaxed text-amber-900">
                  <span className="font-semibold">Demo mode</span> &middot; After signing in, a
                  floating switch lets you toggle between demo roles (BDA / Manager / Admin)
                  without creating multiple accounts. This is a personal portfolio project, not a
                  production system.
                </p>
              </section>

              <section className="flex min-h-0 items-center lg:pl-8">
                <div className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-7">
                  <h2 className="text-base font-semibold text-gray-900">
                    Get started
                  </h2>
                  <p className="mt-1.5 text-sm text-gray-600">
                    Sign in to load the dashboard, or create an account and
                    pick your role next.
                  </p>

                  <div className="mt-5 space-y-2.5">
                    <SignInButton mode="modal" signUpUrl="/sign-up">
                      <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
                        Sign in
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal" signInUrl="/sign-in">
                      <button className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50">
                        Create an account
                      </button>
                    </SignUpButton>
                  </div>

                  <div className="mt-5 flex items-center gap-4 border-t border-gray-200 pt-4 text-[11px] text-gray-500">
                    <span>Auth by Clerk</span>
                    <span>&middot;</span>
                    <span>Email, Google, more</span>
                  </div>
                </div>
              </section>
            </div>
          </main>

          <footer className="h-12 shrink-0 border-t border-gray-100">
            <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6 text-[11px] text-gray-400">
              <p>SalesOps &mdash; personal full-stack project.</p>
              <div className="flex items-center gap-4">
                <span>Vite &middot; React &middot; Express &middot; MongoDB &middot; Clerk &middot; Pusher</span>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-gray-500 transition hover:text-gray-900"
                >
                  <GitHubIcon className="h-3 w-3" />
                  <span>view source</span>
                </a>
              </div>
            </div>
          </footer>
        </div>
      </SignedOut>
    </>
  )
}
