import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  MenuItem, InputAdornment, Stack,
} from '@mui/material';
import { BoltRounded, Email, Lock, Person, Badge } from '@mui/icons-material';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'recruiter' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
    }}>
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: 3,
            background: 'linear-gradient(135deg, #e94560, #c73652)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2,
          }}>
            <BoltRounded sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.02em' }}>
            TalentFlow AI
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
            Create your account
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 4, boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Get started for free</Typography>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  label="Full Name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  InputProps={{ startAdornment: <InputAdornment position="start"><Badge sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
                />
                <TextField
                  label="Email address" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required
                  InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
                />
                <TextField
                  label="Password" type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required inputProps={{ minLength: 6 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
                />
                <TextField
                  select label="Role" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
                >
                  <MenuItem value="recruiter">Recruiter</MenuItem>
                  <MenuItem value="hiring_manager">Hiring Manager</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </TextField>
                <Button
                  type="submit" variant="contained" fullWidth size="large" disabled={loading}
                  sx={{ py: 1.5, background: 'linear-gradient(135deg, #e94560, #c73652)', '&:hover': { background: 'linear-gradient(135deg, #c73652, #a02a42)' } }}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </Stack>
            </form>
            <Typography variant="body2" color="text.secondary" textAlign="center" mt={3}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#e94560', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
