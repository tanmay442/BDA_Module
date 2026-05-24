import { Droppable } from '@hello-pangea/dnd'
import LeadCard from './LeadCard'

const stageLabels = {
  new: 'New',
  contacted: 'Contacted',
  requirement_gathered: 'Req. Gathered',
  quotation_sent: 'Quote Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

const stageColors = {
  new: 'border-t-gray-400',
  contacted: 'border-t-blue-400',
  requirement_gathered: 'border-t-yellow-400',
  quotation_sent: 'border-t-purple-400',
  negotiation: 'border-t-orange-400',
  won: 'border-t-green-400',
  lost: 'border-t-red-400',
}

export default function KanbanColumn({ stage, leads }) {
  return (
    <div
      className={`flex w-64 shrink-0 flex-col rounded-lg border border-gray-200 bg-gray-50 border-t-4 ${stageColors[stage]}`}
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
            className={`flex flex-col gap-2 p-2 min-h-[200px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {leads.map((lead, i) => (
              <LeadCard key={lead._id} lead={lead} index={i} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
