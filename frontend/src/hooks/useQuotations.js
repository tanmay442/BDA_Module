import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export function useQuotations(filters = {}) {
  const params = {}
  if (filters.leadId) params.leadId = filters.leadId
  if (filters.status) params.status = filters.status
  return useQuery({
    queryKey: ['quotations', filters],
    queryFn: () => api.get('/quotations', { params }).then((r) => r.data),
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

export function getQuotationPdfUrl(id) {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  return `${base}/quotations/${id}/pdf`
}
