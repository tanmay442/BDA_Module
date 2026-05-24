import { useState } from 'react'
import { useUsers, useCurrentUser, useUpdateRole } from '../hooks/useUsers'
import UserReportPanel from '../components/UserReportPanel'

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  bda: 'bg-green-100 text-green-700',
}

export default function UsersPage() {
  const { data: currentUser } = useCurrentUser()
  const { data: users, isLoading } = useUsers()
  const updateRole = useUpdateRole()
  const [selectedUser, setSelectedUser] = useState(null)

  const handleRoleChange = (userId, role) => {
    updateRole.mutate({ id: userId, role })
  }

  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">Users</h2>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading users...</p>
      ) : users?.length === 0 ? (
        <p className="text-gray-400">No users found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users?.map((user) => (
                <tr
                  key={user._id}
                  className={`${isManager ? 'cursor-pointer' : ''} hover:bg-gray-50`}
                  onClick={() => isManager && setSelectedUser(user)}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {user.name}
                    {currentUser?._id === user._id && (
                      <span className="ml-2 text-xs text-gray-400">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    {currentUser?.role === 'admin' && currentUser._id !== user._id ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="bda">BDA</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.department || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setSelectedUser(null)} />
          <UserReportPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
        </>
      )}
    </div>
  )
}
