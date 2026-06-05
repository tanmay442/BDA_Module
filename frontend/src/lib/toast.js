import { toast } from 'sonner'

const MUTED_LOGS = new Set(['AbortError', 'CanceledError'])

export function notifySuccess(message) {
  toast.success(message)
}

export function notifyError(messageOrError, fallback = 'Something went wrong') {
  const message = extractMessage(messageOrError) || fallback
  console.error(message, messageOrError)
  toast.error(message)
}

export function notifyInfo(message) {
  toast(message)
}

export function extractMessage(err) {
  if (!err) return null
  if (typeof err === 'string') return err
  if (MUTED_LOGS.has(err.name)) return null
  return (
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    null
  )
}
