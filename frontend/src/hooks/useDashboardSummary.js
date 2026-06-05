import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

export function useDashboardSummary(options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/summary')
      return data
    },
    staleTime: 30_000,
    refetchIntervalInBackground: false,
    ...options,
  })
}
