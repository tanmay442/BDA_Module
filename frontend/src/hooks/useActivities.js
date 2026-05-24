import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export function useActivities(leadId) {
  return useQuery({
    queryKey: ['activities', leadId],
    queryFn: () => api.get('/activities', { params: { leadId } }).then((r) => r.data),
    enabled: !!leadId,
    refetchInterval: 30_000,
  })
}

export function useCreateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/activities', data).then((r) => r.data),
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['activities', data.leadId] }),
  })
}

export function useUpdateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/activities/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  })
}

export function useDeleteActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/activities/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  })
}
