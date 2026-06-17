import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const leadKeys = {
  all: ['leads'],
  lists: () => ['leads', 'list'],
  list: (filters) => ['leads', 'list', filters || {}],
  details: () => ['leads', 'detail'],
  detail: (id) => ['leads', 'detail', id],
}

export function useLeads(filters = {}) {
  const params = {}
  if (filters.stage) params.stage = filters.stage
  if (filters.search) params.search = filters.search
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => api.get('/leads', { params }).then(r => r.data),
    refetchInterval: 30_000,
  })
}

export function useLead(id) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => api.get(`/leads/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

function invalidateLeads(qc, id) {
  qc.invalidateQueries({ queryKey: leadKeys.lists() })
  if (id) qc.invalidateQueries({ queryKey: leadKeys.detail(id) })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/leads', data).then((r) => r.data),
    onSuccess: (data) => invalidateLeads(qc, data?._id),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/leads/${id}`, data).then((r) => r.data),
    onSuccess: (_data, vars) => invalidateLeads(qc, vars.id),
  })
}

export function useStageTransition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stage }) => api.patch(`/leads/${id}/stage`, { stage }).then((r) => r.data),
    onSuccess: (_data, vars) => invalidateLeads(qc, vars.id),
  })
}
