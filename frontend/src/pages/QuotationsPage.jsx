import { useState } from 'react'
import { useQuotations, useDeleteQuotation, getQuotationPdfUrl } from '../hooks/useQuotations'
import CreateQuotationModal from '../components/CreateQuotationModal'

const statusColors = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  revised: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function QuotationsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState({ status: '' })
  const { data: quotations, isLoading } = useQuotations(filter)
  const deleteQuote = useDeleteQuotation()

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Quotations</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Quotation
        </button>
      </div>

      <div className="mb-4">
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="revised">Revised</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading quotations...</p>
      ) : quotations?.length === 0 ? (
        <p className="text-gray-400">No quotations found.</p>
      ) : (
        <div className="space-y-2">
          {quotations?.map((q) => (
            <div key={q._id} className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-800">{q.quotationNumber}</h4>
                <p className="text-xs text-gray-500">
                  {q.leadId?.companyName || 'No lead'} &middot; ${q.grandTotal.toLocaleString()}
                </p>
                {q.items && (
                  <p className="text-xs text-gray-400">{q.items.length} item(s) &middot; v{q.version}</p>
                )}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[q.status] || 'bg-gray-100'}`}>
                {q.status}
              </span>
              <a
                href={getQuotationPdfUrl(q._id)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                PDF
              </a>
              <button
                onClick={() => deleteQuote.mutate(q._id)}
                className="text-sm text-red-400 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateQuotationModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
