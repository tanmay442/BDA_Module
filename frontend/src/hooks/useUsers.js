import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    staleTime: 60_000,
    refetchIntervalInBackground: false,
  })
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
    staleTime: 60_000,
    refetchIntervalInBackground: false,
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }) => api.patch(`/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDemoSwitchRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ targetRole }) => api.post('/demo/switch-role', { targetRole }).then(r => r.data),
    onSuccess: (user) => {
      qc.setQueryData(['users', 'me'], user)
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['quotations'] })
      qc.invalidateQueries({ queryKey: ['activities'] })
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUserReport(userId, options = {}) {
  return useQuery({
    queryKey: ['users', userId, 'report'],
    queryFn: () => api.get(`/users/${userId}/report`).then(r => r.data),
    enabled: !!userId,
    staleTime: 30_000,
    refetchIntervalInBackground: false,
    ...options,
  })
}
