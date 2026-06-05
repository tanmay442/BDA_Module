import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export function useTasks(filters = {}) {
  const params = {}
  if (filters.status) params.status = filters.status
  if (filters.priority) params.priority = filters.priority
  if (filters.leadId) params.leadId = filters.leadId
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.get('/tasks', { params }).then((r) => r.data),
    staleTime: 60_000,
    refetchIntervalInBackground: false,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/tasks', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/tasks/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
