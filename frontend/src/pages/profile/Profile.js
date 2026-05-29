import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/services';
import { Card, Button, Input, Badge } from '../../components/ui';
import toast from 'react-hot-toast';
import { User, Lock, Shield } from 'lucide-react';

const roleColor = { admin: 'red', recruiter: 'indigo', hiring_manager: 'green' };

export default function Profile() {
  const { user, setUser } = useAuth();
  const [info, setInfo] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const handleInfoSave = async (e) => {
    e.preventDefault();
    if (!info.name.trim()) return toast.error('Name is required');
    setSavingInfo(true);
    try {
      const res = await authAPI.updateProfile({ name: info.name, email: info.email });
      setUser(res.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingInfo(false);
    }
  };

  const handlePwdSave = async (e) => {
    e.preventDefault();
    if (!pwd.currentPassword || !pwd.newPassword) return toast.error('All password fields required');
    if (pwd.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (pwd.newPassword !== pwd.confirm) return toast.error('Passwords do not match');
    setSavingPwd(true);
    try {
      await authAPI.updateProfile({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success('Password changed successfully');
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="mt-1">
              <Badge color={roleColor[user?.role] || 'gray'}>
                <Shield className="w-3 h-3 mr-1 inline" />
                {user?.role?.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" /> Account Information
        </h3>
        <form onSubmit={handleInfoSave} className="space-y-4">
          <Input
            label="Full Name"
            value={info.name}
            onChange={(e) => setInfo((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Email Address"
            type="email"
            value={info.email}
            onChange={(e) => setInfo((p) => ({ ...p, email: e.target.value }))}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={savingInfo}>Save Changes</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600" /> Change Password
        </h3>
        <form onSubmit={handlePwdSave} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={pwd.currentPassword}
            onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
          />
          <Input
            label="New Password"
            type="password"
            value={pwd.newPassword}
            onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={pwd.confirm}
            onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={savingPwd}>Update Password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
