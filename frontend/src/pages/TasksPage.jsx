import { useState } from 'react'
import { useTasks, useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import CreateTaskModal from '../components/CreateTaskModal'

export default function TasksPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState({ status: '', priority: '' })
  const { data: tasks, isLoading } = useTasks(filter)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const toggleComplete = (task) => {
    updateTask.mutate({
      id: task._id,
      data: { status: task.status === 'completed' ? 'pending' : 'completed' },
    })
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Task
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading tasks...</p>
      ) : tasks?.length === 0 ? (
        <p className="text-gray-400">No tasks found.</p>
      ) : (
        <div className="space-y-2">
          {tasks?.map((task) => (
            <div
              key={task._id}
              className={`flex items-center gap-4 rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm p-4 ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={task.status === 'completed'}
                onChange={() => toggleComplete(task)}
                className="h-5 w-5 rounded border-gray-300"
              />
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {task.title}
                </h4>
                {task.description && (
                  <p className="mt-0.5 text-xs text-gray-500 truncate">{task.description}</p>
                )}
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                  {task.dueDate && (
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  )}
                  {task.leadId && <span>Lead: {task.leadId.companyName || 'N/A'}</span>}
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority] || 'bg-gray-100'}`}>
                {task.priority}
              </span>
              <button
                onClick={() => deleteTask.mutate(task._id)}
                className="text-sm text-red-400 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
