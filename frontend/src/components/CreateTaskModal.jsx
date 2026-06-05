import { useState, useEffect } from 'react'
import { useCreateTask } from '../hooks/useTasks'
import { useUsers } from '../hooks/useUsers'

export default function CreateTaskModal({ open, onClose, leadId }) {
  const { data: users } = useUsers()
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
  })
  const createTask = useCreateTask()

  useEffect(() => {
    if (open && leadId) {
      setForm((prev) => ({ ...prev, leadId }))
    }
  }, [open, leadId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createTask.mutateAsync({
        ...form,
        leadId: leadId || form.leadId || undefined,
        assignedTo: form.assignedTo || undefined,
        dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      })
      setForm({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' })
      onClose()
    } catch (err) {
      console.error('Failed to create task', err)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800">New Task</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            required
            placeholder="Task Title *"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            placeholder="Description"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
          >
            <option value="">Assign to...</option>
            {users?.map((u) => (
              <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
            ))}
          </select>
          <input
            type="date"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createTask.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
