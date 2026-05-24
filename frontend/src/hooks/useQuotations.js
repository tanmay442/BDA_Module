import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export function useQuotations(filters = {}) {
  const params = {}
  if (filters.leadId) params.leadId = filters.leadId
  if (filters.status) params.status = filters.status
  return useQuery({
    queryKey: ['quotations', filters],
    queryFn: () => api.get('/quotations', { params }).then((r) => r.data),
    refetchInterval: 30_000,
  })
}

export function useCreateQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/quotations', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotations'] }),
  })
}

export function useUpdateQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/quotations/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotations'] }),
  })
}

export function useDeleteQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/quotations/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotations'] }),
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
