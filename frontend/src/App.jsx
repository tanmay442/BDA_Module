import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setTokenProvider } from './services/api'
import usePusher from './hooks/usePusher'
import AppLayout from './components/AppLayout'
import { useCurrentUser } from './hooks/useUsers'
import Grainient from './components/Grainient'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import OnboardingPage from './pages/OnboardingPage'
import Dashboard from './pages/Dashboard'
import LeadsPage from './pages/LeadsPage'
import TasksPage from './pages/TasksPage'
import QuotationsPage from './pages/QuotationsPage'
import UsersPage from './pages/UsersPage'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const queryClient = new QueryClient()

function ClerkTokenProvider({ children }) {
  const { getToken } = useAuth()
  const { isSignedIn } = useUser()
  React.useEffect(() => { setTokenProvider(getToken) }, [getToken])
  // Gate the actual Pusher connection on the signed-in state by
  // passing the flag through, so the hook itself stays unconditional
  // (rules of hooks) and the connection only opens after sign-in.
  usePusher({ enabled: isSignedIn })
  return children
}

function ProtectedRoute() {
  const location = useLocation()
  return (
    <>
      <SignedIn>
        <OnboardingGate />
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace state={{ from: location }} />
      </SignedOut>
    </>
  )
}

function OnboardingGate() {
  const { data: currentUser, isLoading, isError } = useCurrentUser()

  // Show a tiny loading skeleton while the auth handshake + the
  // /users/me round-trip are pending. Without this, the page can
  // flash blank for up to 30s on a slow connection.
  if (isLoading) {
    return (
      <div className="flex h-screen min-h-[100dvh] items-center justify-center bg-gray-50/70">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (isError) {
    // /users/me 401'd (stale session) — bounce to sign-in.
    return <Navigate to="/sign-in" replace />
  }

  if (currentUser && (!currentUser.company || !currentUser.role)) {
    return <OnboardingPage />
  }

  return <AppLayout />
}

function AppContent() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Grainient
          color1="#FF9FFC"
          color2="#5227FF"
          color3="#B497CF"
          timeSpeed={0.15}
          warpStrength={0.6}
          warpFrequency={4.0}
          grainAmount={0.05}
          contrast={1.2}
          saturation={0.9}
          zoom={0.95}
        />
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/sign-in" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <ClerkTokenProvider>
          <AppContent />
        </ClerkTokenProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}
