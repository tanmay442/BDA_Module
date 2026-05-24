import { useState } from 'react'
import KanbanBoard from '../components/KanbanBoard'
import LeadDetailPanel from '../components/LeadDetailPanel'
import CreateLeadModal from '../components/CreateLeadModal'

export default function LeadsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState(null)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Lead Pipeline</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Lead
        </button>
      </div>
      <KanbanBoard onLeadClick={setSelectedLeadId} />
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
