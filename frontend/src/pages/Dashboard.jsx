import { useMemo } from 'react'
import {
  startOfMonth, endOfMonth, isWithinInterval, isToday, subDays,
} from 'date-fns'
import { useLeads } from '../hooks/useLeads'
import { useTasks, useUpdateTask } from '../hooks/useTasks'
import { useQuotations } from '../hooks/useQuotations'
import { useCurrentUser, useUsers } from '../hooks/useUsers'
import { DollarSign, Target, Activity, FileText, CheckCircle, AlertTriangle } from 'lucide-react'
import PipelineChart from '@/components/application/charts/PipelineChart'
import LeadSourcesChart from '@/components/application/charts/LeadSourcesChart'
import RevenueTrendChart from '@/components/application/charts/RevenueTrendChart'
import { BarChart } from '@/components/application/charts/bar-chart'

const stageLabels = {
  new: 'New',
  contacted: 'Contacted',
  requirement_gathered: 'Req. Gathered',
  quotation_sent: 'Quotation',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

export default function Dashboard() {
  const { data: currentUser } = useCurrentUser()
  const { data: leads } = useLeads()
  const { data: tasks } = useTasks()
  const { data: quotations } = useQuotations()
  const { data: users } = useUsers()
  const updateTask = useUpdateTask()

  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'manager'
  // Memoize the clock read so monthStart/monthEnd keep referential
  // identity across renders. Without this, the `wonMtd` useMemo
  // recomputes on every render and React Compiler flags the deps
  // as potentially-mutated.
  const now = useMemo(() => new Date(), [])
  const monthStart = useMemo(() => startOfMonth(now), [now])
  const monthEnd = useMemo(() => endOfMonth(now), [now])

  /* ── computed shared ── */
  const activeLeads = useMemo(() => (leads || []).filter((l) => l.currentStage !== 'won' && l.currentStage !== 'lost'), [leads])
  const wonLeads = useMemo(() => (leads || []).filter((l) => l.currentStage === 'won'), [leads])
  const lostLeads = useMemo(() => (leads || []).filter((l) => l.currentStage === 'lost'), [leads])
  const pendingTasks = useMemo(() => (tasks || []).filter((t) => t.status === 'pending'), [tasks])
  const tasksDueToday = useMemo(() => pendingTasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate))), [pendingTasks])
  const totalValue = useMemo(() => (leads || []).reduce((s, l) => s + (l.expectedDealValue || 0), 0), [leads])
  const wonMtd = useMemo(
    () => wonLeads.filter((l) => isWithinInterval(new Date(l.createdAt), { start: monthStart, end: monthEnd })),
    [wonLeads, monthStart, monthEnd],
  )
  const totalClosed = wonLeads.length + lostLeads.length
  const winLossRatio = totalClosed > 0
    ? Math.round((wonLeads.length / totalClosed) * 100)
    : null

  /* ── pipeline funnel data ── */
  const stageCounts = useMemo(() => {
    const counts = {}
    for (const lead of leads || []) {
      counts[lead.currentStage] = (counts[lead.currentStage] || 0) + 1
    }
    return counts
  }, [leads])

  const pipelineData = useMemo(
    () =>
      ['new', 'contacted', 'requirement_gathered', 'quotation_sent', 'negotiation', 'won']
        .map((stage) => ({
          stage: stageLabels[stage],
          leads: stageCounts[stage] || 0,
        })),
    [stageCounts],
  )

  /* ── lead sources donut data ── */
  const sourceData = useMemo(() => {
    const counts = {}
    for (const lead of leads || []) {
      const s = lead.source || 'Other'
      counts[s] = (counts[s] || 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [leads])

  /* ── revenue trend data (monthly expected vs actual) ── */
  const revenueTrendData = useMemo(() => {
    if (!leads?.length) return []
    const now = new Date()
    const months = {}
    for (const lead of leads) {
      const d = new Date(lead.createdAt)
      const key = d.toLocaleDateString('en-US', { month: 'short' })
      if (!months[key]) months[key] = { month: key, expected: 0, actual: 0 }
      months[key].expected += lead.expectedDealValue || 0
      if (lead.currentStage === 'won') months[key].actual += lead.expectedDealValue || 0
    }
    const ordered = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const nowMonth = now.toLocaleDateString('en-US', { month: 'short' })
    const idx = ordered.indexOf(nowMonth)
    const range = ordered.slice(Math.max(0, idx - 5), idx + 1)
    return range.map((m) => months[m] || { month: m, expected: 0, actual: 0 })
  }, [leads])

  /* ── BDA leaderboard ── */
  const leadsByBda = useMemo(() => {
    const map = {}
    for (const lead of leads || []) {
      const name = lead.assignedTo?.name || 'Unassigned'
      // Use the BDA _id (or a sentinel for the unassigned bucket) as the
      // stable sort key. Sorting by value causes bars to shuffle on every
      // Pusher invalidation when totals are close, which reads as visual
      // noise. Sorting by _id keeps each bar pinned to its owner.
      const bdaId = lead.assignedTo?._id || '__unassigned__'
      if (!map[bdaId]) map[bdaId] = { name, total: 0, won: 0, value: 0 }
      map[bdaId].total++
      map[bdaId].value += lead.expectedDealValue || 0
      if (lead.currentStage === 'won') map[bdaId].won++
    }
    return map
  }, [leads])

  const barData = useMemo(
    () =>
      Object.entries(leadsByBda)
        .map(([bdaId, stats]) => ({ bdaId, name: stats.name, value: stats.value }))
        .sort((a, b) => a.bdaId.localeCompare(b.bdaId)),
    [leadsByBda],
  )

  /* ── hot leads (negotiation, top 5) ── */
  const hotLeads = useMemo(
    () =>
      (leads || [])
        .filter((l) => l.currentStage === 'negotiation')
        .sort((a, b) => (b.expectedDealValue || 0) - (a.expectedDealValue || 0))
        .slice(0, 5),
    [leads],
  )

  /* ── stalled deals (no update in 14d) ── */
  const stalledDeals = useMemo(
    () =>
      (leads || []).filter((l) => {
        if (l.currentStage === 'won' || l.currentStage === 'lost') return false
        return new Date(l.updatedAt) < subDays(new Date(), 14)
      }),
    [leads],
  )

  /* ── recent wins ── */
  const recentWins = useMemo(
    () => [...wonLeads].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5),
    [wonLeads],
  )

  const handleMarkDone = (taskId) => {
    updateTask.mutate({ id: taskId, data: { status: 'completed' } })
  }

  const bdaUsers = users?.filter((u) => u.role === 'bda')?.length || 1
  const monthlyTarget = isManager ? 500000 * bdaUsers : 500000
  const monthlyAchieved = wonMtd.reduce((s, l) => s + (l.expectedDealValue || 0), 0)

  return (
    <div>
      {/* ─── Header ─── */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          Hello, {currentUser?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Here is your summary for{' '}
          {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isManager ? (
          <>
            <KPICard icon={DollarSign} label="Total Pipeline Value" value={fmtCurrency(totalValue)} />
            <KPICard icon={CheckCircle} label="Revenue Won (MTD)" value={fmtCurrency(monthlyAchieved)} />
            <KPICard icon={Target} label="Win / Loss Ratio" value={winLossRatio === null ? "n/a" : `${winLossRatio}%`} />
            <KPICard icon={FileText} label="Pending Approvals" value={quotations?.filter((q) => q.status === 'draft' || q.status === 'sent').length || 0} />
          </>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-4 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">My Monthly Target</p>
                <Target className="size-4 text-gray-400" />
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900">{fmtCurrency(monthlyAchieved)}</p>
              <p className="text-xs text-gray-500">of {fmtCurrency(monthlyTarget)}</p>
              <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min((monthlyAchieved / monthlyTarget) * 100, 100)}%` }}
                />
              </div>
            </div>
            <KPICard icon={Activity} label="Active Leads" value={activeLeads.length} />
            <KPICard icon={FileText} label="Quotations Sent" value={quotations?.filter((q) => q.status === 'sent').length || 0} />
            <KPICard icon={AlertTriangle} label="Tasks Due Today" value={tasksDueToday.length} urgent />
          </>
        )}
      </div>

      {/* ─── Charts Row (Pipeline + Sources / Leaderboard) ─── */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {isManager ? (
          <>
            <div className="lg:col-span-3">
              <PipelineChart data={pipelineData} />
            </div>
            <div className="lg:col-span-2">
              <BarChart data={barData} />
            </div>
          </>
        ) : (
          <>
            <div className="lg:col-span-3">
              <PipelineChart data={pipelineData} />
            </div>
            <div className="lg:col-span-2">
              <LeadSourcesChart data={sourceData} />
            </div>
          </>
        )}
      </div>

      {/* ─── Revenue Trend (manager only) ─── */}
      {isManager && (
        <div className="mb-4">
          <RevenueTrendChart data={revenueTrendData} />
        </div>
      )}

      {/* ─── Bottom Widgets (50/50) ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 backdrop-blur-sm">
          <h3 className="mb-3 text-base font-semibold text-gray-700">
            {isManager ? 'Recent Wins' : "Today's Action Items"}
          </h3>
          {isManager ? (
            recentWins.length > 0 ? (
              <div className="space-y-2">
                {recentWins.map((lead) => (
                  <div key={lead._id} className="flex items-center justify-between border-b border-gray-100 pb-1.5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{lead.companyName}</p>
                      <p className="text-xs text-gray-500">Won by {lead.assignedTo?.name || 'Unassigned'}</p>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      ${(lead.expectedDealValue || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No deals won yet this month.</p>
            )
          ) : tasksDueToday.length > 0 ? (
            <div className="space-y-1.5">
              {tasksDueToday.map((task) => (
                <div key={task._id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-2.5 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{task.title}</p>
                    {task.leadId && (
                      <p className="truncate text-xs text-gray-500">{task.leadId.companyName || 'Lead'}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleMarkDone(task._id)}
                    disabled={updateTask.isPending}
                    className="ml-3 shrink-0 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Done
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No tasks due today.</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white/80 p-4 backdrop-blur-sm">
          <h3 className="mb-3 text-base font-semibold text-gray-700">
            {isManager ? 'Stalled Deals' : 'Hot Leads'}
          </h3>
          {isManager ? (
            stalledDeals.length > 0 ? (
              <div className="space-y-2">
                {stalledDeals.map((lead) => (
                  <div key={lead._id} className="flex items-center justify-between border-b border-gray-100 pb-1.5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{lead.companyName}</p>
                      <p className="text-xs text-gray-500">
                        {stageLabels[lead.currentStage]} · {lead.assignedTo?.name || 'Unassigned'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-orange-500">
                      ${(lead.expectedDealValue || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No stalled deals.</p>
            )
          ) : hotLeads.length > 0 ? (
            <div className="space-y-2">
              {hotLeads.map((lead) => (
                <div key={lead._id} className="flex items-center justify-between border-b border-gray-100 pb-1.5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{lead.companyName}</p>
                    <p className="text-xs text-gray-500">{lead.contactPerson || '—'} · Negotiation</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${(lead.expectedDealValue || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No hot leads in negotiation.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function fmtCurrency(n) {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(0)}k`
      : `$${n.toLocaleString()}`
}

function KPICard({ icon: Icon, label, value, urgent }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
        {Icon && <Icon className="size-4 text-gray-400" />}
      </div>
      <p className={`mt-1 text-2xl font-bold ${urgent ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}
