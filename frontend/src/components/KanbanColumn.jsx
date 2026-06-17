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

const stageAccents = {
  new: 'border-t-gray-400',
  contacted: 'border-t-blue-400',
  requirement_gathered: 'border-t-yellow-400',
  quotation_sent: 'border-t-purple-400',
  negotiation: 'border-t-orange-400',
  won: 'border-t-green-400',
  lost: 'border-t-red-400',
}

export default function KanbanColumn({ stage, leads, onLeadClick }) {
  return (
    <div
      className={`flex w-64 shrink-0 flex-col rounded-lg border border-gray-100 bg-white/40 backdrop-blur-sm border-t-4 ${stageAccents[stage]}`}
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
            {leads.length === 0 && (
              <div
                className={`flex flex-1 items-center justify-center rounded-md border-2 border-dashed text-center text-xs ${
                  snapshot.isDraggingOver
                    ? 'border-blue-400 bg-blue-50/50 text-blue-600'
                    : 'border-gray-200 text-gray-400'
                }`}
              >
                Drop a lead here
              </div>
            )}
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
