import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setTokenProvider } from './services/api'
import usePusher from './hooks/usePusher'
import AppLayout from './components/AppLayout'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import Dashboard from './pages/Dashboard'
import LeadsPage from './pages/LeadsPage'
import TasksPage from './pages/TasksPage'
import QuotationsPage from './pages/QuotationsPage'
import UsersPage from './pages/UsersPage'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const queryClient = new QueryClient()

function ClerkTokenProvider({ children }) {
  const { getToken } = useAuth()
  React.useEffect(() => { setTokenProvider(getToken) }, [getToken])
  usePusher()
  return children
}

function ProtectedRoute() {
  return (
    <>
      <SignedIn>
        <AppLayout />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <ClerkTokenProvider>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </ClerkTokenProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}
