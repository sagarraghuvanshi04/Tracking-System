import { useEffect, useState } from 'react';
import { authAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem,
  Button, Chip, Stack, CircularProgress, Divider, Avatar,
} from '@mui/material';
import { ManageAccounts } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ROLE_COLOR = { admin: 'error', recruiter: 'primary', hiring_manager: 'success' };

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
    <Box sx={{ maxWidth: 700 }}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <ManageAccounts sx={{ color: '#e94560', fontSize: 22 }} />
            <Typography variant="subtitle1" fontWeight={700}>User Management</Typography>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>
          ) : (
            <Stack divider={<Divider />}>
              {users.map((u) => (
                <Box key={u._id} sx={{ py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#1a1a2e', fontWeight: 700, width: 36, height: 36, fontSize: '0.85rem' }}>
                    {u.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {u.name} {u._id === currentUser?._id && <Box component="span" sx={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.75rem' }}>(you)</Box>}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {format(new Date(u.createdAt), 'MMM d, yyyy')}
                  </Typography>
                  {u._id === currentUser?._id ? (
                    <Chip label={u.role.replace('_', ' ')} size="small" color={ROLE_COLOR[u.role]} sx={{ fontWeight: 600, textTransform: 'capitalize' }} />
                  ) : (
                    <TextField select size="small" value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)} sx={{ minWidth: 150 }}>
                      <MenuItem value="recruiter">Recruiter</MenuItem>
                      <MenuItem value="hiring_manager">Hiring Manager</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </TextField>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
