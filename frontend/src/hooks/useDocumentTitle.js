import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const BASE = 'SalesOps'
const TITLES = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/tasks': 'Tasks',
  '/quotations': 'Quotations',
  '/users': 'Users',
  '/onboarding': 'Onboarding',
  '/sign-in': 'Sign In',
  '/sign-up': 'Sign Up',
}

const ORIGINAL_TITLE = typeof document !== 'undefined' ? document.title : BASE

export function useDocumentTitle(title) {
  useEffect(() => {
    if (title) {
      document.title = `${title} · ${BASE}`
    }
  }, [title])
}

export function useRouteTitle() {
  const location = useLocation()
  const title = TITLES[location.pathname]
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : BASE
  }, [title])
}

export function resetDocumentTitle() {
  document.title = ORIGINAL_TITLE
}
