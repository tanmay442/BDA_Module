import { useState } from 'react'
import { useCreateQuotation } from '../hooks/useQuotations'

export default function CreateQuotationModal({ open, onClose }) {
  const [form, setForm] = useState({
    leadId: '',
    items: [{ productName: '', quantity: 1, unitPrice: 0, totalPrice: 0, moq: '', deliveryEstimate: '' }],
    tax: 0,
  })
  const createQuote = useCreateQuotation()

  const updateItem = (i, field, value) => {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      items[i].totalPrice = (Number(items[i].quantity) || 0) * (Number(items[i].unitPrice) || 0)
    }
    setForm({ ...form, items })
  }

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { productName: '', quantity: 1, unitPrice: 0, totalPrice: 0, moq: '', deliveryEstimate: '' }] })
  }

  const removeItem = (i) => {
    if (form.items.length > 1) {
      setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const subtotal = form.items.reduce((sum, item) => sum + item.totalPrice, 0)
      const grandTotal = subtotal + Number(form.tax)
      await createQuote.mutateAsync({
        leadId: form.leadId || undefined,
        items: form.items.filter((i) => i.productName),
        subtotal,
        tax: Number(form.tax) || 0,
        grandTotal,
      })
      setForm({ leadId: '', items: [{ productName: '', quantity: 1, unitPrice: 0, totalPrice: 0, moq: '', deliveryEstimate: '' }], tax: 0 })
      onClose()
    } catch {
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-800">New Quotation</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            placeholder="Lead ID (optional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.leadId}
            onChange={(e) => setForm({ ...form, leadId: e.target.value })}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Items</h4>
              <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700">+ Add Item</button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  required
                  placeholder="Product Name"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={item.productName}
                  onChange={(e) => updateItem(i, 'productName', e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-24 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))}
                />
                <span className="py-2 text-sm text-gray-600 w-20 text-right">
                  ${item.totalPrice.toFixed(2)}
                </span>
                <input
                  type="number"
                  min="1"
                  placeholder="MOQ"
                  className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                  value={item.moq}
                  onChange={(e) => updateItem(i, 'moq', Number(e.target.value))}
                />
                <input
                  placeholder="Delivery"
                  className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                  value={item.deliveryEstimate}
                  onChange={(e) => updateItem(i, 'deliveryEstimate', e.target.value)}
                />
                {form.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="py-2 text-red-400 hover:text-red-600">&times;</button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <label className="text-sm text-gray-600">Tax:</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.tax}
              onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })}
            />
          </div>

          <div className="text-right text-sm text-gray-600">
            Subtotal: ${form.items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2)}<br />
            Grand Total: ${(form.items.reduce((s, i) => s + i.totalPrice, 0) + Number(form.tax)).toFixed(2)}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={createQuote.isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
              {createQuote.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
