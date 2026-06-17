import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const quotationKeys = {
  all: ['quotations'],
  lists: () => ['quotations', 'list'],
  list: (filters) => ['quotations', 'list', filters || {}],
}

export function useQuotations(filters = {}) {
  const params = {}
  if (filters.leadId) params.leadId = filters.leadId
  if (filters.status) params.status = filters.status
  return useQuery({
    queryKey: quotationKeys.list(filters),
    queryFn: () => api.get('/quotations', { params }).then((r) => r.data),
    refetchInterval: 30_000,
  })
}

export function useCreateQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/quotations', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: quotationKeys.lists() }),
  })
}

export function useUpdateQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/quotations/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: quotationKeys.lists() }),
  })
}

export function useDeleteQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/quotations/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: quotationKeys.lists() }),
  })
}

export async function downloadQuotationPdf(id, filename) {
  const res = await api.get(`/quotations/${id}/pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `${id}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
