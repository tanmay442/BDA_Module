import { useState } from 'react'
import { useLead, useUpdateLead, useStageTransition } from '../hooks/useLeads'
import { useActivities, useCreateActivity } from '../hooks/useActivities'
import { useTasks } from '../hooks/useTasks'
import { useQuotations, downloadQuotationPdf } from '../hooks/useQuotations'
import CreateQuotationModal from './CreateQuotationModal'
import CreateTaskModal from './CreateTaskModal'

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

/**
 * Edit form for a lead. Extracted so its state can be reset by
 * remounting (keyed on leadId in the parent) when the user
 * navigates to a different lead. Without that remount, edits
 * made to lead A would silently land on lead B if the user
 * clicked a different card before saving.
 */
function LeadEditForm({ lead, onSaved, onCancel }) {
  const updateLead = useUpdateLead()
  const [form, setForm] = useState({})

  const handleSave = async () => {
    try {
      await updateLead.mutateAsync({ id: lead._id, data: form })
      onSaved()
    } catch {
      // Error surfaced via mutation state; user can retry.
    }
  }

  return (
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
        <button
          onClick={handleSave}
          disabled={updateLead.isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {updateLead.isPending ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function LeadDetailPanel({ leadId, onClose }) {
  const { data: lead, isLoading } = useLead(leadId)
  const { data: activities } = useActivities(leadId)
  const { data: quotations } = useQuotations({ leadId })
  const { data: tasks } = useTasks({ leadId })
  const stageTransition = useStageTransition()
  const createActivity = useCreateActivity()

  const [newActivity, setNewActivity] = useState({ type: 'note', message: '' })
  const [tab, setTab] = useState('activity')
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editing, setEditing] = useState(false)
  const [stageError, setStageError] = useState(null)

  if (isLoading || !lead) {
    return (
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-white/90 backdrop-blur-sm shadow-xl border-l border-gray-200 p-6">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  const currentIdx = stages.indexOf(lead.currentStage)

  const handleStageChange = async (stage) => {
    setStageError(null)
    try {
      await stageTransition.mutateAsync({ id: lead._id, stage })
    } catch (err) {
      setStageError(err?.response?.data?.message || 'Could not change stage')
    }
  }

  const handleAddActivity = async (e) => {
    e.preventDefault()
    try {
      await createActivity.mutateAsync({ leadId: lead._id, ...newActivity })
      setNewActivity({ type: 'note', message: '' })
    } catch {
      // toast surface is the next iteration
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-white/90 backdrop-blur-sm shadow-xl border-l border-gray-200 flex flex-col">
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
          {stageError && (
            <p className="mt-1 text-xs text-red-600">{stageError}</p>
          )}
        </div>

        {editing ? (
          // keying the form on leadId remounts it when the user
          // navigates to a different lead, so a half-typed edit
          // never lands on the wrong record.
          <LeadEditForm
            key={leadId}
            lead={lead}
            onSaved={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="space-y-2 rounded-lg border border-gray-200 p-3 text-sm">
            <p><span className="text-gray-500">Contact:</span> {lead.contactPerson || '—'}</p>
            <p><span className="text-gray-500">Email:</span> {lead.email || '—'}</p>
            <p><span className="text-gray-500">Phone:</span> {lead.phone || '—'}</p>
            <p><span className="text-gray-500">Deal value:</span> ₹{lead.expectedDealValue?.toLocaleString() || 0}</p>
            <p><span className="text-gray-500">Notes:</span> {lead.notes || '—'}</p>
            <button onClick={() => setEditing(true)} className="mt-2 rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">
              Edit
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {['activity', 'quotations', 'tasks'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                  tab === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowQuoteModal(true)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700">
              + Quote
            </button>
            <button onClick={() => setShowTaskModal(true)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
              + Task
            </button>
          </div>
        </div>

        {tab === 'activity' && (
          <>
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
            <div className="space-y-2 max-h-80 overflow-y-auto">
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
          </>
        )}

        {tab === 'quotations' && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {quotations?.length === 0 && (
              <p className="text-xs text-gray-400">No quotations yet.</p>
            )}
            {quotations?.map((q) => (
              <div key={q._id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{q.quotationNumber}</span>
                  <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5 capitalize">{q.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">${q.grandTotal?.toLocaleString()} &middot; v{q.version}</p>
                <button
                  onClick={() => downloadQuotationPdf(q._id, `${q.quotationNumber}.pdf`)}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  Download PDF
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'tasks' && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tasks?.length === 0 && (
              <p className="text-xs text-gray-400">No tasks yet.</p>
            )}
            {tasks?.map((t) => (
              <div key={t._id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{t.title}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 capitalize ${
                    t.priority === 'high' ? 'bg-red-100 text-red-700' :
                    t.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{t.priority}</span>
                </div>
                {t.dueDate && (
                  <p className="text-xs text-gray-500 mt-1">Due: {new Date(t.dueDate).toLocaleDateString()}</p>
                )}
                <span className={`text-xs mt-1 inline-block rounded-full px-2 py-0.5 ${
                  t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <CreateQuotationModal open={showQuoteModal} onClose={() => setShowQuoteModal(false)} leadId={lead?._id} />
      <CreateTaskModal open={showTaskModal} onClose={() => setShowTaskModal(false)} leadId={lead?._id} />
    </div>
  )
}
