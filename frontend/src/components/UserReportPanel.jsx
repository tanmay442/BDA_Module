import { useMemo } from 'react'
import { useLeads } from '../hooks/useLeads'
import { useTasks } from '../hooks/useTasks'
import { useQuotations } from '../hooks/useQuotations'
import PipelineChart from '@/components/application/charts/PipelineChart'
import { STAGE_LABELS_KANBAN as stageLabels, PIPELINE_STAGES } from '../constants/stages'

export default function UserReportPanel({ user, onClose }) {
  const { data: leads } = useLeads()
  const { data: tasks } = useTasks()
  const { data: quotations } = useQuotations()

  const userLeads = useMemo(
    () => (leads || []).filter((l) => l.assignedTo?._id === user._id || l.assignedTo === user._id),
    [leads, user],
  )
  const userTasks = useMemo(
    () => (tasks || []).filter((t) => t.assignedTo?._id === user._id || t.assignedTo === user._id),
    [tasks, user],
  )
  const userQuotations = useMemo(
    () => (quotations || []).filter((q) => q.createdBy?._id === user._id || q.createdBy === user._id),
    [quotations, user],
  )

  const wonLeads = userLeads.filter((l) => l.currentStage === 'won')
  const completedTasks = userTasks.filter((t) => t.status === 'completed')
  const pendingTasks = userTasks.filter((t) => t.status === 'pending')

  const stageCounts = {}
  for (const lead of userLeads) {
    stageCounts[lead.currentStage] = (stageCounts[lead.currentStage] || 0) + 1
  }

  const pipelineData = PIPELINE_STAGES.map(
    (stage) => ({
      stage: stageLabels[stage],
      leads: stageCounts[stage] || 0,
    }),
  )

  const totalValue = userLeads.reduce((s, l) => s + (l.expectedDealValue || 0), 0)

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl bg-white/90 backdrop-blur-sm shadow-xl border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{user.role} &middot; {user.department || 'No department'}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
            <p className="text-xs text-gray-500">Total Leads</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{userLeads.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
            <p className="text-xs text-gray-500">Won</p>
            <p className="mt-1 text-xl font-bold text-green-600">{wonLeads.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
            <p className="text-xs text-gray-500">Tasks Done</p>
            <p className="mt-1 text-xl font-bold text-blue-600">{completedTasks.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
            <p className="text-xs text-gray-500">Quotations</p>
            <p className="mt-1 text-xl font-bold text-purple-600">{userQuotations.length}</p>
          </div>
        </div>

        {/* Pipeline chart */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Pipeline</h4>
          <PipelineChart data={pipelineData} />
        </div>

        {/* Value & win rate */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
            <p className="text-xs text-gray-500">Pipeline Value</p>
            <p className="text-lg font-bold text-gray-900">${(totalValue / 1000).toFixed(1)}k</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
            <p className="text-xs text-gray-500">Win Rate</p>
            <p className="text-lg font-bold text-gray-900">
              {userLeads.length ? Math.round((wonLeads.length / userLeads.length) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Tasks */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Tasks ({pendingTasks.length} pending)</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {userTasks.length === 0 && <p className="text-xs text-gray-400">No tasks assigned.</p>}
            {userTasks.slice(0, 10).map((t) => (
              <div key={t._id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.title}</p>
                  {t.dueDate && (
                    <p className="text-xs text-gray-500">Due: {new Date(t.dueDate).toLocaleDateString()}</p>
                  )}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  t.status === 'completed' ? 'bg-green-100 text-green-700' :
                  t.priority === 'high' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quotations */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Quotations ({userQuotations.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {userQuotations.length === 0 && <p className="text-xs text-gray-400">No quotations created.</p>}
            {userQuotations.slice(0, 10).map((q) => (
              <div key={q._id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{q.quotationNumber}</p>
                  <p className="text-xs text-gray-500">{q.leadId?.companyName || 'No lead'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${q.grandTotal?.toLocaleString()}</p>
                  <span className="text-xs capitalize text-gray-500">{q.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Leads ({userLeads.length})</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {userLeads.length === 0 && <p className="text-xs text-gray-400">No leads assigned.</p>}
            {userLeads.map((l) => (
              <div key={l._id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{l.companyName}</p>
                  <p className="text-xs text-gray-500">{l.contactPerson || '—'} &middot; {stageLabels[l.currentStage]}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">${(l.expectedDealValue || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
