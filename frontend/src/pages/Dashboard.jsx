import { useMemo, useState } from 'react'
import { isToday } from 'date-fns'
import { useTasks, useUpdateTask } from '../hooks/useTasks'
import { useCurrentUser } from '../hooks/useUsers'
import { useDashboardSummary } from '../hooks/useDashboardSummary'
import { formatCurrency, formatCurrencyExact, formatNumber } from '../lib/format'
import { DollarSign, Target, Activity, FileText, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import PipelineChart from '@/components/application/charts/PipelineChart'
import LeadSourcesChart from '@/components/application/charts/LeadSourcesChart'
import RevenueTrendChart from '@/components/application/charts/RevenueTrendChart'
import { BarChart } from '@/components/application/charts/bar-chart'
import { STAGE_LABELS_SHORT as stageLabels } from '../constants/stages'

export default function Dashboard() {
  const { data: currentUser } = useCurrentUser()
  const { data: tasks } = useTasks()
  const updateTask = useUpdateTask()
  const { data: summary, isLoading } = useDashboardSummary()

  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'manager'
  const [now] = useState(() => new Date())

  const tasksDueToday = useMemo(() => {
    if (isManager) return []
    return (tasks || []).filter((t) => t.status === 'pending' && t.dueDate && isToday(new Date(t.dueDate)))
  }, [tasks, isManager])

  const handleMarkDone = (taskId) => {
    updateTask.mutate({ id: taskId, data: { status: 'completed' } })
  }

  if (isLoading || !summary) {
    return <div className="py-8 text-center text-sm text-gray-400">Loading dashboard…</div>
  }

  const {
    pipeline = [],
    leadSources = [],
    totals = {},
    quotation = {},
    tasks: taskCounts = {},
    monthly = {},
    leaderboard = [],
    hotLeads = [],
    recentWins = [],
    stalledDeals = [],
  } = summary

  const quotationSentCount = (quotation.byStatus && quotation.byStatus.sent) || 0
  const totalValue = totals.pipelineValue || 0
  const monthlyAchieved = monthly.achieved || 0
  const monthlyTarget = monthly.target || 500_000
  const pendingApprovals = quotation.pendingApprovals || 0

  const barData = useMemo(
    () => (leaderboard || []).map((row) => ({ name: row.name, value: row.value })),
    [leaderboard],
  )

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          Hello, {currentUser?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Here is your summary for{' '}
          {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isManager ? (
          <>
            <KPICard icon={DollarSign} label="Total Pipeline Value" value={formatCurrency(totalValue)} />
            <KPICard icon={CheckCircle} label="Revenue Won (MTD)" value={formatCurrency(monthlyAchieved)} />
            <KPICard icon={Target} label="Win / Loss Ratio" value={`${totals.winLossRatio || 0}%`} />
            <KPICard icon={FileText} label="Pending Approvals" value={pendingApprovals} />
          </>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-4 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">My Monthly Target</p>
                <Target className="size-4 text-gray-400" />
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(monthlyAchieved)}</p>
              <p className="text-xs text-gray-500">of {formatCurrency(monthlyTarget)}</p>
              <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min((monthlyAchieved / monthlyTarget) * 100, 100)}%` }}
                />
              </div>
            </div>
            <KPICard icon={Activity} label="Active Leads" value={(totals.totalLeads || 0) - (totals.wonCount || 0) - (totals.lostCount || 0)} />
            <KPICard icon={FileText} label="Quotations Sent" value={quotationSentCount} />
            <KPICard icon={AlertTriangle} label="Tasks Due Today" value={tasksDueToday.length} urgent />
          </>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {isManager ? (
          <>
            <div className="lg:col-span-3">
              <PipelineChart data={pipeline} />
            </div>
            <div className="lg:col-span-2">
              <BarChart data={barData} />
            </div>
          </>
        ) : (
          <>
            <div className="lg:col-span-3">
              <PipelineChart data={pipeline} />
            </div>
            <div className="lg:col-span-2">
              <LeadSourcesChart data={leadSources} />
            </div>
          </>
        )}
      </div>

      {isManager && (
        <div className="mb-4">
          <RevenueTrendChart data={[]} />
        </div>
      )}

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
                      {formatCurrencyExact(lead.expectedDealValue)}
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
                        {stageLabels[lead.currentStage] || lead.currentStage} · {lead.assignedTo?.name || 'Unassigned'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-orange-500">
                      {formatCurrencyExact(lead.expectedDealValue)}
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
                      {formatCurrencyExact(lead.expectedDealValue)}
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
