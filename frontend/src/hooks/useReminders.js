import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

export function useReminders() {
  return useQuery({
    queryKey: ['reminders'],
    queryFn: () => api.get('/reminders').then(r => r.data),
    staleTime: 60_000,
    refetchIntervalInBackground: false,
  })
}
