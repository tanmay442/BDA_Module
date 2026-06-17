import { useState } from 'react'
import { useCreateLead } from '../hooks/useLeads'

export default function CreateLeadModal({ open, onClose }) {
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    expectedDealValue: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const createLead = useCreateLead()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createLead.mutateAsync({
        ...form,
        expectedDealValue: Number(form.expectedDealValue) || 0,
      })
      setForm({ companyName: '', contactPerson: '', email: '', phone: '', expectedDealValue: '', notes: '' })
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create lead')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800">New Lead</h3>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            required
            placeholder="Company Name *"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          <input
            placeholder="Contact Person"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
          />
          <input
            placeholder="Email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Phone"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            placeholder="Expected Deal Value ($)"
            type="number"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.expectedDealValue}
            onChange={(e) => setForm({ ...form, expectedDealValue: e.target.value })}
          />
          <textarea
            placeholder="Notes"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLead.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createLead.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
