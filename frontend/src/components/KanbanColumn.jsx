import { Droppable } from '@hello-pangea/dnd'
import LeadCard from './LeadCard'
import { STAGE_LABELS_KANBAN as stageLabels, STAGE_ACCENTS } from '../constants/stages'

const stageBorderAccents = Object.fromEntries(
  Object.entries(STAGE_ACCENTS).map(([k, v]) => [k, `border-t-${v}-400`])
)

export default function KanbanColumn({ stage, leads, onLeadClick }) {
  return (
    <div
      className={`flex w-64 shrink-0 flex-col rounded-lg border border-gray-100 bg-white/40 backdrop-blur-sm border-t-4 ${stageBorderAccents[stage]}`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold text-gray-700">
          {stageLabels[stage] || stage}
        </h3>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
          {leads.length}
        </span>
      </div>
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
            }`}
          >
            {leads.map((lead, i) => (
              <LeadCard key={lead._id} lead={lead} index={i} onClick={() => onLeadClick?.(lead._id)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
