import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const userKeys = {
  all: ['users'],
  me: () => ['users', 'me'],
  list: () => ['users', 'list'],
}

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => api.get('/users/me').then(r => r.data),
    // Poll less aggressively. React-Query's default stale-while-revalidate
    // covers most cases; the 30s poll was a holdover from the pre-auth
    // debug phase.
    refetchInterval: 30_000,
  })
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => api.get('/users').then(r => r.data),
    refetchInterval: 30_000,
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }) => api.patch(`/users/${id}/role`, { role }),
    onSuccess: (_data, vars) => {
      // Refetch the affected user (so the role pill in the table updates)
      // and the list. If the current user changed their own role, also
      // refetch /users/me so role-gated UI re-renders.
      qc.invalidateQueries({ queryKey: userKeys.list() })
      const me = qc.getQueryData(userKeys.me())
      if (me && vars && vars.id === me._id) {
        qc.invalidateQueries({ queryKey: userKeys.me() })
      }
    },
  })
}
