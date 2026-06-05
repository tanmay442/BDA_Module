import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { setTokenProvider, setErrorReporter } from './services/api'
import { notifyError } from './lib/toast'
import usePusher from './hooks/usePusher'
import AppLayout from './components/AppLayout'
import DemoRoleSwitcher from './components/DemoRoleSwitcher'
import ErrorBoundary from './components/ErrorBoundary'
import { FullPageLoader } from './components/FullPageLoader'
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
  React.useEffect(() => {
    setTokenProvider(getToken)
    setErrorReporter(notifyError)
  }, [getToken])
  usePusher()
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
  const { data: currentUser, isLoading } = useCurrentUser()

  if (isLoading) return <FullPageLoader label="Loading workspace…" />

  if (currentUser && !currentUser.company) {
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
        <DemoRoleSwitcher />
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </div>
  )
}

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <ClerkTokenProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </ClerkTokenProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}
