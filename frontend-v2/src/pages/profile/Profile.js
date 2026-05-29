import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/services';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Chip, Stack, Avatar, InputAdornment,
} from '@mui/material';
import { Person, Lock, Shield, Email } from '@mui/icons-material';
import toast from 'react-hot-toast';

const ROLE_COLOR = { admin: 'error', recruiter: 'primary', hiring_manager: 'success' };

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
      setUser(res.data); toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update profile'); }
    finally { setSavingInfo(false); }
  };

  const handlePwdSave = async (e) => {
    e.preventDefault();
    if (!pwd.currentPassword || !pwd.newPassword) return toast.error('All fields required');
    if (pwd.newPassword.length < 6) return toast.error('Min 6 characters');
    if (pwd.newPassword !== pwd.confirm) return toast.error('Passwords do not match');
    setSavingPwd(true);
    try {
      await authAPI.updateProfile({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success('Password changed'); setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingPwd(false); }
  };

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: '#e94560', fontSize: '1.6rem', fontWeight: 800 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              <Chip
                icon={<Shield sx={{ fontSize: '14px !important' }} />}
                label={user?.role?.replace('_', ' ')}
                size="small"
                color={ROLE_COLOR[user?.role] || 'default'}
                sx={{ mt: 0.8, fontWeight: 600, textTransform: 'capitalize' }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Person sx={{ color: '#e94560', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700}>Account Information</Typography>
          </Box>
          <form onSubmit={handleInfoSave}>
            <Stack spacing={2.5}>
              <TextField fullWidth label="Full Name" value={info.name}
                onChange={(e) => setInfo((p) => ({ ...p, name: e.target.value }))} />
              <TextField fullWidth label="Email Address" type="email" value={info.email}
                onChange={(e) => setInfo((p) => ({ ...p, email: e.target.value }))}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> } }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="contained" disabled={savingInfo}
                  sx={{ background: 'linear-gradient(135deg, #e94560, #c73652)', '&:hover': { background: 'linear-gradient(135deg, #c73652, #a02a42)' } }}>
                  {savingInfo ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Lock sx={{ color: '#e94560', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700}>Change Password</Typography>
          </Box>
          <form onSubmit={handlePwdSave}>
            <Stack spacing={2.5}>
              <TextField fullWidth label="Current Password" type="password" value={pwd.currentPassword}
                onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} />
              <TextField fullWidth label="New Password" type="password" value={pwd.newPassword}
                onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} helperText="Minimum 6 characters" />
              <TextField fullWidth label="Confirm New Password" type="password" value={pwd.confirm}
                onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="contained" disabled={savingPwd}
                  sx={{ background: 'linear-gradient(135deg, #e94560, #c73652)', '&:hover': { background: 'linear-gradient(135deg, #c73652, #a02a42)' } }}>
                  {savingPwd ? 'Updating...' : 'Update Password'}
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
