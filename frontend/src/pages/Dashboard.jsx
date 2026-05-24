import { useLeads } from '../hooks/useLeads'
import { useTasks } from '../hooks/useTasks'
import { useQuotations } from '../hooks/useQuotations'
import { useCurrentUser, useUsers } from '../hooks/useUsers'

const stageLabels = {
  new: 'New',
  contacted: 'Contacted',
  requirement_gathered: 'Req. Gathered',
  quotation_sent: 'Quote Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

export default function Dashboard() {
  const { data: leads } = useLeads()
  const { data: tasks } = useTasks()
  const { data: quotations } = useQuotations()
  const { data: currentUser } = useCurrentUser()
  const { data: users } = useUsers()

  const pendingTasks = tasks?.filter((t) => t.status === 'pending') || []
  const wonLeads = leads?.filter((l) => l.currentStage === 'won') || []
  const totalValue = leads?.reduce((s, l) => s + (l.expectedDealValue || 0), 0) || 0
  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  const stageCounts = {}
  for (const lead of leads || []) {
    stageCounts[lead.currentStage] = (stageCounts[lead.currentStage] || 0) + 1
  }

  const stageValues = {}
  for (const lead of leads || []) {
    stageValues[lead.currentStage] = (stageValues[lead.currentStage] || 0) + (lead.expectedDealValue || 0)
  }

  const leadsByBda = {}
  for (const lead of leads || []) {
    const name = lead.assignedTo?.name || 'Unassigned'
    if (!leadsByBda[name]) leadsByBda[name] = { total: 0, won: 0, value: 0 }
    leadsByBda[name].total++
    leadsByBda[name].value += lead.expectedDealValue || 0
    if (lead.currentStage === 'won') leadsByBda[name].won++
  }

  const conversionRate = leads?.length ? Math.round((wonLeads.length / leads.length) * 100) : 0

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Leads</p>
          <p className="mt-1 text-3xl font-bold text-gray-800">{leads?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Pipeline Value</p>
          <p className="mt-1 text-3xl font-bold text-gray-800">${(totalValue / 1000).toFixed(1)}k</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Won Deals</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{wonLeads.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="mt-1 text-3xl font-bold text-blue-600">{conversionRate}%</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Leads by Stage</h3>
          {Object.keys(stageLabels).map((stage) => {
            const count = stageCounts[stage] || 0
            const val = stageValues[stage] || 0
            const pct = leads?.length ? Math.round((count / leads.length) * 100) : 0
            return (
              <div key={stage} className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{stageLabels[stage]}</span>
                  <span className="text-gray-500">{count} (${(val / 1000).toFixed(1)}k)</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      stage === 'won' ? 'bg-green-500' : stage === 'lost' ? 'bg-red-400' : 'bg-blue-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Recent Quotations</h3>
          {quotations?.slice(0, 5).map((q) => (
            <div key={q._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{q.quotationNumber}</p>
                <p className="text-xs text-gray-500">{q.leadId?.companyName || 'No lead'}</p>
              </div>
              <span className="text-sm font-medium text-gray-700">${q.grandTotal.toLocaleString()}</span>
            </div>
          ))}
          {(!quotations || quotations.length === 0) && (
            <p className="text-sm text-gray-400">No quotations yet.</p>
          )}
        </div>
      </div>

      {isManager && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Team Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500">
                  <th className="pb-2">BDA</th>
                  <th className="pb-2">Leads</th>
                  <th className="pb-2">Won</th>
                  <th className="pb-2">Win Rate</th>
                  <th className="pb-2">Pipeline Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(leadsByBda).map(([name, stats]) => (
                  <tr key={name}>
                    <td className="py-2 font-medium text-gray-800">{name}</td>
                    <td className="py-2 text-gray-600">{stats.total}</td>
                    <td className="py-2 text-gray-600">{stats.won}</td>
                    <td className="py-2 text-gray-600">{stats.total ? Math.round((stats.won / stats.total) * 100) : 0}%</td>
                    <td className="py-2 text-gray-600">${(stats.value / 1000).toFixed(1)}k</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
