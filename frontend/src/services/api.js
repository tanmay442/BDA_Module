import axios from 'axios'
import { extractMessage } from '../lib/toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

let getClerkToken = null
let showErrorToast = null

export function setTokenProvider(fn) {
  getClerkToken = fn
}

export function setErrorReporter(fn) {
  showErrorToast = fn
}

api.interceptors.request.use(async (config) => {
  if (getClerkToken) {
    const token = await getClerkToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (showErrorToast) {
      const message = extractMessage(error)
      const status = error.response?.status
      const isAuthBounce = status === 401
      const isNetwork = !error.response
      if (message && !isAuthBounce && !isNetwork) {
        showErrorToast(message)
      } else if (isNetwork) {
        showErrorToast('Network error — check your connection')
      }
    }
    return Promise.reject(error)
  },
)

export default api
