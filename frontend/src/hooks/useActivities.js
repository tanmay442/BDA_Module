import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const activityKeys = {
  all: ['activities'],
  byLead: (leadId) => ['activities', 'lead', leadId],
}

export function useActivities(leadId) {
  return useQuery({
    queryKey: activityKeys.byLead(leadId),
    queryFn: () => api.get('/activities', { params: { leadId } }).then((r) => r.data),
    enabled: !!leadId,
    refetchInterval: 30_000,
  })
}

export function useCreateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/activities', data).then((r) => r.data),
    onSuccess: (data) => {
      if (data?.leadId) {
        qc.invalidateQueries({ queryKey: activityKeys.byLead(data.leadId) })
      } else {
        qc.invalidateQueries({ queryKey: activityKeys.all })
      }
    },
  })
}
