import { Draggable } from '@hello-pangea/dnd'
import { STAGE_ACCENTS } from '../constants/stages'

const accentColors = Object.fromEntries(
  Object.entries(STAGE_ACCENTS).map(([k, v]) => [k, `border-l-${v}-400`])
)

export default function LeadCard({ lead, index, onClick }) {
  return (
    <Draggable draggableId={lead._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`cursor-pointer rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : 'hover:shadow-md'
          } border-l-4 ${accentColors[lead.currentStage] || 'border-l-gray-200'}`}
        >
          <div className="p-3">
            <h4 className="font-semibold text-gray-800">{lead.companyName}</h4>
            {lead.contactPerson && (
              <p className="mt-1 text-sm text-gray-500">{lead.contactPerson}</p>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span>${(lead.expectedDealValue || 0).toLocaleString()}</span>
              {lead.assignedTo && (
                <span className="max-w-[100px] truncate">
                  {lead.assignedTo.name || 'Unassigned'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
