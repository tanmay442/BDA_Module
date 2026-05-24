import { useState } from 'react'
import { useLead, useUpdateLead, useStageTransition } from '../hooks/useLeads'
import { useActivities, useCreateActivity } from '../hooks/useActivities'

const stages = [
  'new',
  'contacted',
  'requirement_gathered',
  'quotation_sent',
  'negotiation',
  'won',
  'lost',
]

const stageLabels = {
  new: 'New',
  contacted: 'Contacted',
  requirement_gathered: 'Requirements Gathered',
  quotation_sent: 'Quotation Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

export default function LeadDetailPanel({ leadId, onClose }) {
  const { data: lead, isLoading } = useLead(leadId)
  const { data: activities } = useActivities(leadId)
  const updateLead = useUpdateLead()
  const stageTransition = useStageTransition()
  const createActivity = useCreateActivity()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})

  const [newActivity, setNewActivity] = useState({ type: 'note', message: '' })

  if (isLoading || !lead) {
    return (
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-white shadow-xl border-l border-gray-200 p-6">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  const handleSave = async () => {
    await updateLead.mutateAsync({ id: lead._id, data: form })
    setEditing(false)
  }

  const handleStageChange = async (stage) => {
    await stageTransition.mutateAsync({ id: lead._id, stage })
  }

  const handleAddActivity = async (e) => {
    e.preventDefault()
    if (!newActivity.message.trim()) return
    await createActivity.mutateAsync({ leadId: lead._id, ...newActivity })
    setNewActivity({ type: 'note', message: '' })
  }

  const currentIdx = stages.indexOf(lead.currentStage)

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-white shadow-xl border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-bold text-gray-800">{lead.companyName}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            {stages.map((s, i) => (
              <button
                key={s}
                onClick={() => handleStageChange(s)}
                disabled={Math.abs(i - currentIdx) > 1 || stageTransition.isPending}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  i === currentIdx
                    ? 'bg-blue-600 ring-2 ring-blue-300 scale-125'
                    : i < currentIdx
                    ? 'bg-green-400'
                    : 'bg-gray-200 hover:bg-gray-300'
                } disabled:opacity-50`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {stageLabels[lead.currentStage]} &mdash; {currentIdx + 1} of {stages.length}
          </p>
        </div>

        {editing ? (
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              defaultValue={lead.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              placeholder="Contact Person"
            />
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              defaultValue={lead.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
            />
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              defaultValue={lead.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
            />
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              type="number"
              defaultValue={lead.expectedDealValue}
              onChange={(e) => setForm({ ...form, expectedDealValue: Number(e.target.value) })}
              placeholder="Expected Deal Value"
            />
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              defaultValue={lead.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-gray-500">Contact</span>
              <span>{lead.contactPerson || '—'}</span>
              <span className="text-gray-500">Email</span>
              <span>{lead.email || '—'}</span>
              <span className="text-gray-500">Phone</span>
              <span>{lead.phone || '—'}</span>
              <span className="text-gray-500">Value</span>
              <span>${(lead.expectedDealValue || 0).toLocaleString()}</span>
              <span className="text-gray-500">Assigned To</span>
              <span>{lead.assignedTo?.name || 'Unassigned'}</span>
              <span className="text-gray-500">Created</span>
              <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
            </div>
            {lead.notes && (
              <div>
                <span className="text-gray-500 block mb-1">Notes</span>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{lead.notes}</p>
              </div>
            )}
            <button
              onClick={() => { setForm({}); setEditing(true) }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit Details
            </button>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Activity Log</h4>
          <form onSubmit={handleAddActivity} className="mb-3 flex gap-2">
            <select
              value={newActivity.type}
              onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
              className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
            >
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="meeting">Meeting</option>
              <option value="follow_up">Follow Up</option>
            </select>
            <input
              required
              placeholder="Add a note..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={newActivity.message}
              onChange={(e) => setNewActivity({ ...newActivity, message: e.target.value })}
            />
            <button
              type="submit"
              disabled={createActivity.isPending}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </form>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {activities?.length === 0 && (
              <p className="text-xs text-gray-400">No activity yet.</p>
            )}
            {activities?.map((act) => (
              <div key={act._id} className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 capitalize">{act.type}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(act.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{act.message}</p>
                <p className="text-xs text-gray-400 mt-1">{act.userId?.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
