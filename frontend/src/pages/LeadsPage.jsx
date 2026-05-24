import { useState } from 'react'
import KanbanBoard from '../components/KanbanBoard'
import LeadDetailPanel from '../components/LeadDetailPanel'
import CreateLeadModal from '../components/CreateLeadModal'

export default function LeadsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState(null)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Lead Pipeline</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Lead
        </button>
      </div>
      <div className="mb-4 flex gap-2">
        <input
          placeholder="Search leads..."
          className="max-w-xs flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          <option value="">All Stages</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="requirement_gathered">Req. Gathered</option>
          <option value="quotation_sent">Quote Sent</option>
          <option value="negotiation">Negotiation</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </div>
      <div className="flex-1">
        <KanbanBoard onLeadClick={setSelectedLeadId} search={search} stageFilter={stageFilter} />
      </div>
      {selectedLeadId && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setSelectedLeadId(null)} />
          <LeadDetailPanel leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
        </>
      )}
      <CreateLeadModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
