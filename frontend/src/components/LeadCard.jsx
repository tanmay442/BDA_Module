import { Draggable } from '@hello-pangea/dnd'

const stageColors = {
  new: 'bg-gray-100 border-gray-300',
  contacted: 'bg-blue-50 border-blue-300',
  requirement_gathered: 'bg-yellow-50 border-yellow-300',
  quotation_sent: 'bg-purple-50 border-purple-300',
  negotiation: 'bg-orange-50 border-orange-300',
  won: 'bg-green-50 border-green-300',
  lost: 'bg-red-50 border-red-300',
}

export default function LeadCard({ lead, index }) {
  return (
    <Draggable draggableId={lead._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`rounded-lg border-2 p-3 shadow-sm transition-shadow ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
          } ${stageColors[lead.currentStage] || 'bg-white border-gray-200'}`}
        >
          <h4 className="font-semibold text-gray-800">{lead.companyName}</h4>
          {lead.contactPerson && (
            <p className="mt-1 text-sm text-gray-500">{lead.contactPerson}</p>
          )}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>${(lead.expectedDealValue || 0).toLocaleString()}</span>
            {lead.assignedTo && (
              <span className="truncate max-w-[100px]">
                {lead.assignedTo.name || 'Unassigned'}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
