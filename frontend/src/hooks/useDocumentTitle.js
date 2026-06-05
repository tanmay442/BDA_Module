import { useEffect } from 'react'

const BASE = 'SalesOps'

export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} \u00b7 ${BASE}` : BASE
    return () => {
      document.title = previous
    }
  }, [title])
}
