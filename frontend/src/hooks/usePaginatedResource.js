import { useCallback, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '../services/api'

const DEFAULT_LIMIT = 50

export function createPaginatedResource(path, queryKey, options = {}) {
  return function usePaginatedResource(extraParams = {}) {
    const [page, setPage] = useState(options.initialPage || 1)
    const [limit, setLimit] = useState(options.initialLimit || DEFAULT_LIMIT)

    const params = { page, limit, ...extraParams }

    const query = useQuery({
      queryKey: [...queryKey, params],
      queryFn: () => api.get(path, { params }).then((r) => r.data),
      placeholderData: keepPreviousData,
      staleTime: options.staleTime ?? 30_000,
      refetchIntervalInBackground: false,
      ...options.queryOptions,
    })

    const goToPage = useCallback((next) => {
      setPage((current) => Math.max(1, typeof next === 'function' ? next(current) : next))
    }, [])

    const setLimitAndReset = useCallback((next) => {
      setLimit(next)
      setPage(1)
    }, [])

    return {
      ...query,
      page,
      limit,
      setPage: goToPage,
      nextPage: () => goToPage((p) => p + 1),
      prevPage: () => goToPage((p) => Math.max(1, p - 1)),
      setLimit: setLimitAndReset,
      data: query.data?.data ?? [],
      pagination: query.data?.pagination,
    }
  }
}

export const usePaginatedLeads = createPaginatedResource('/leads', ['leads', 'paginated'])
export const usePaginatedTasks = createPaginatedResource('/tasks', ['tasks', 'paginated'])
export const usePaginatedQuotations = createPaginatedResource('/quotations', ['quotations', 'paginated'])
export const usePaginatedActivities = createPaginatedResource('/activities', ['activities', 'paginated'])
export const usePaginatedClients = createPaginatedResource('/clients', ['clients', 'paginated'])
export const usePaginatedUsers = createPaginatedResource('/users', ['users', 'paginated'])
