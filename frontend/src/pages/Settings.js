import { useEffect, useState } from 'react';
import { authAPI } from '../api/services';
import { Card, Badge, Spinner } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const roleColor = { admin: 'red', recruiter: 'indigo', hiring_manager: 'green' };

export default function Settings() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.getUsers()
      .then((res) => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      const res = await authAPI.updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u._id === userId ? res.data : u)));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Management</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u._id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                  {u.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{u.name} {u._id === currentUser?._id && <span className="text-xs text-gray-400">(you)</span>}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <p className="text-xs text-gray-400 hidden sm:block">{format(new Date(u.createdAt), 'MMM d, yyyy')}</p>
                {u._id === currentUser?._id ? (
                  <Badge color={roleColor[u.role]}>{u.role.replace('_', ' ')}</Badge>
                ) : (
                  <select
                    className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  >
                    <option value="recruiter">Recruiter</option>
                    <option value="hiring_manager">Hiring Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
