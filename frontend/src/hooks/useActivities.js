import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export function useActivities(leadId) {
  return useQuery({
    queryKey: ['activities', leadId],
    queryFn: () => api.get('/activities', { params: { leadId } }).then((r) => r.data),
    enabled: !!leadId,
  })
}

export function useCreateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/activities', data).then((r) => r.data),
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['activities', data.leadId] }),
  })
}
