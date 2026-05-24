import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
})

let getClerkToken = null

export function setTokenProvider(fn) {
  getClerkToken = fn
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

export default api
