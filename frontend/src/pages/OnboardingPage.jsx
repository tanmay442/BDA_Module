import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useCurrentUser } from '../hooks/useUsers'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import api from '../services/api'

export default function OnboardingPage() {
  const { user } = useUser()
  const { refetch } = useCurrentUser()
  const navigate = useNavigate()
  useDocumentTitle('Onboarding')
  const [form, setForm] = useState({
    name: user?.fullName || user?.emailAddresses?.[0]?.emailAddress || '',
    role: '',
    company: 'ACME Manufacturing',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.role || !form.company) {
      setError('Please select a role and enter your company name.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.patch('/users/me/onboard', form)
      await refetch()
      navigate('/', { replace: true })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/70 px-4">
      <div className="w-full max-w-md rounded-xl bg-white/90 backdrop-blur-sm p-8 shadow-lg">
        <div className="text-center mb-6">
          <span className="text-4xl">🏭</span>
          <h1 className="mt-2 text-xl font-bold text-gray-800">Welcome to SalesOps</h1>
          <p className="mt-1 text-sm text-gray-500">Set up your profile to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Role</label>
            <select
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="">Select your role</option>
              <option value="manager">Manager</option>
              <option value="bda">BDA (Business Development Associate)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
              value={form.company}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  )
}
