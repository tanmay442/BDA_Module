import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export function useLeads(filters = {}) {
  const params = {}
  if (filters.stage) params.stage = filters.stage
  if (filters.search) params.search = filters.search
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => api.get('/leads', { params }).then(r => r.data),
    refetchInterval: 30_000,
  })
}

export function useLead(id) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: () => api.get(`/leads/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/leads', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/leads/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useStageTransition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stage }) => api.patch(`/leads/${id}/stage`, { stage }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}
