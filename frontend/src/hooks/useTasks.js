import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const taskKeys = {
  all: ['tasks'],
  lists: () => ['tasks', 'list'],
  list: (filters) => ['tasks', 'list', filters || {}],
}

export function useTasks(filters = {}) {
  const params = {}
  if (filters.status) params.status = filters.status
  if (filters.priority) params.priority = filters.priority
  if (filters.leadId) params.leadId = filters.leadId
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => api.get('/tasks', { params }).then((r) => r.data),
    refetchInterval: 30_000,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/tasks', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/tasks/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  })
}
