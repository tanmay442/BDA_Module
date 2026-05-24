import { DragDropContext } from '@hello-pangea/dnd'
import KanbanColumn from './KanbanColumn'
import { useLeads, useStageTransition } from '../hooks/useLeads'

const stages = [
  'new',
  'contacted',
  'requirement_gathered',
  'quotation_sent',
  'negotiation',
  'won',
  'lost',
]

function groupByStage(leads) {
  const groups = {}
  for (const stage of stages) {
    groups[stage] = []
  }
  for (const lead of leads || []) {
    if (groups[lead.currentStage]) {
      groups[lead.currentStage].push(lead)
    }
  }
  return groups
}

export default function KanbanBoard({ onLeadClick, search, stageFilter }) {
  const { data: leads, isLoading, error } = useLeads({ search, stage: stageFilter })
  const stageTransition = useStageTransition()

  const handleDragEnd = (result) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    if (result.source.droppableId === destination.droppableId) return

    stageTransition.mutate({
      id: draggableId,
      stage: destination.droppableId,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading leads...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-red-500">
        Failed to load leads: {error.message}
      </div>
    )
  }

  const grouped = groupByStage(leads)

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-250px)] gap-4 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {stages.map((stage) => (
          <KanbanColumn key={stage} stage={stage} leads={grouped[stage] || []} onLeadClick={onLeadClick} />
        ))}
      </div>
    </DragDropContext>
  )
}
