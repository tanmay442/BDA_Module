import { useState } from 'react'
import KanbanBoard from '../components/KanbanBoard'
import CreateLeadModal from '../components/CreateLeadModal'

export default function LeadsPage() {
  const [showCreate, setShowCreate] = useState(false)

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
      <KanbanBoard />
      <CreateLeadModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
