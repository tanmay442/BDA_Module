import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import UsersPage from '../pages/UsersPage'

vi.mock('../hooks/useUsers', () => ({
  useCurrentUser: vi.fn(),
  useUsers: vi.fn(),
  useUpdateRole: vi.fn(() => ({ mutate: vi.fn() })),
}))

import { useCurrentUser, useUsers } from '../hooks/useUsers'

function renderPage() {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <UsersPage />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state', () => {
    useCurrentUser.mockReturnValue({ data: null, isLoading: true })
    useUsers.mockReturnValue({ data: null, isLoading: true })
    renderPage()
    expect(screen.getByText('Loading users...')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    useCurrentUser.mockReturnValue({ data: null, isLoading: false })
    useUsers.mockReturnValue({ data: [], isLoading: false })
    renderPage()
    expect(screen.getByText('No users found.')).toBeInTheDocument()
  })

  it('renders user rows', () => {
    useCurrentUser.mockReturnValue({ data: { _id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' }, isLoading: false })
    useUsers.mockReturnValue({
      data: [
        { _id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin', department: 'Engineering', createdAt: '2025-01-01' },
        { _id: '2', name: 'BDA User', email: 'bda@test.com', role: 'bda', department: null, createdAt: '2025-01-02' },
      ],
      isLoading: false,
    })
    renderPage()
    expect(screen.getAllByText('Admin').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('BDA User')).toBeInTheDocument()
    expect(screen.getByText('(you)')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
  })
})
