import { useEffect, useState } from 'react';
import { jobsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, Stack,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, CircularProgress, Divider,
} from '@mui/material';
import {
  Add, Search, LocationOn, Schedule, AttachMoney, People,
  Edit, Delete, Visibility, Work,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLOR = { active: 'success', draft: 'default', paused: 'warning', closed: 'error' };
const TYPE_COLOR = { 'full-time': 'primary', 'part-time': 'secondary', contract: 'warning', remote: 'info', hybrid: 'success' };
const EMPTY_FORM = { title: '', department: '', location: '', type: 'full-time', experience: '', description: '', requirements: '', skills: '', status: 'active', 'salary.min': '', 'salary.max': '' };

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewJob, setViewJob] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.getAll({ search, status: statusFilter, page, limit: 9 });
      setJobs(res.data.jobs); setTotal(res.data.total);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [search, statusFilter, page]); // eslint-disable-line

  const openCreate = () => { setEditJob(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (job) => {
    setEditJob(job);
    setForm({ title: job.title, department: job.department, location: job.location, type: job.type, experience: job.experience, description: job.description, requirements: job.requirements?.join('\n') || '', skills: job.skills?.join(', ') || '', status: job.status, 'salary.min': job.salary?.min || '', 'salary.max': job.salary?.max || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, requirements: form.requirements.split('\n').filter(Boolean), skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean), salary: { min: Number(form['salary.min']) || 0, max: Number(form['salary.max']) || 0 } };
      delete payload['salary.min']; delete payload['salary.max'];
      if (editJob) { await jobsAPI.update(editJob._id, payload); toast.success('Job updated'); }
      else { await jobsAPI.create(payload); toast.success('Job created'); }
      setModalOpen(false); fetchJobs();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    try { await jobsAPI.delete(id); toast.success('Deleted'); fetchJobs(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search jobs..." size="small" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ flex: 1, minWidth: 200 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> } }}
        />
        <TextField select size="small" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} sx={{ minWidth: 140 }} label="Status">
          <MenuItem value="">All Status</MenuItem>
          {['active','draft','paused','closed'].map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
        </TextField>
        {['admin','recruiter'].includes(user?.role) && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}
            sx={{ background: 'linear-gradient(135deg, #e94560, #c73652)', '&:hover': { background: 'linear-gradient(135deg, #c73652, #a02a42)' } }}>
            Post Job
          </Button>
        )}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>{total} job{total !== 1 ? 's' : ''} found</Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>
      ) : jobs.length === 0 ? (
        <Card><CardContent sx={{ textAlign: 'center', py: 8 }}><Work sx={{ fontSize: 48, color: '#e2e8f0', mb: 2 }} /><Typography color="text.secondary">No jobs found. Create your first job posting!</Typography></CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {jobs.map((job) => (
            <Grid item xs={12} md={6} xl={4} key={job._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }, transition: 'box-shadow 0.2s' }}>
                <CardContent sx={{ flex: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} noWrap>{job.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{job.department}</Typography>
                    </Box>
                    <Chip label={job.status} size="small" color={STATUS_COLOR[job.status]} sx={{ fontWeight: 600, textTransform: 'capitalize' }} />
                  </Box>
                  <Stack spacing={0.8} mb={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><LocationOn sx={{ fontSize: 14, color: '#94a3b8' }} /><Typography variant="caption" color="text.secondary">{job.location}</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Schedule sx={{ fontSize: 14, color: '#94a3b8' }} /><Typography variant="caption" color="text.secondary">{job.experience}</Typography></Box>
                    {(job.salary?.min || job.salary?.max) && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><AttachMoney sx={{ fontSize: 14, color: '#94a3b8' }} /><Typography variant="caption" color="text.secondary">{job.salary.min && job.salary.max ? `${job.salary.min.toLocaleString()} – ${job.salary.max.toLocaleString()}` : job.salary.min || job.salary.max}</Typography></Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><People sx={{ fontSize: 14, color: '#94a3b8' }} /><Typography variant="caption" color="text.secondary">{job.applicantsCount} applicants</Typography></Box>
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    <Chip label={job.type} size="small" color={TYPE_COLOR[job.type]} variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    {job.skills?.slice(0, 3).map((s) => <Chip key={s} label={s} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />)}
                    {job.skills?.length > 3 && <Chip label={`+${job.skills.length - 3}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />}
                  </Box>
                </CardContent>
                <Divider />
                <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button size="small" startIcon={<Visibility sx={{ fontSize: 14 }} />} onClick={() => setViewJob(job)} sx={{ color: '#64748b', fontSize: '0.75rem' }}>View</Button>
                  {['admin','recruiter'].includes(user?.role) && <Button size="small" startIcon={<Edit sx={{ fontSize: 14 }} />} onClick={() => openEdit(job)} sx={{ color: '#64748b', fontSize: '0.75rem' }}>Edit</Button>}
                  {user?.role === 'admin' && <Button size="small" startIcon={<Delete sx={{ fontSize: 14 }} />} onClick={() => handleDelete(job._id)} sx={{ color: '#ef4444', fontSize: '0.75rem' }}>Delete</Button>}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{format(new Date(job.createdAt), 'MMM d')}</Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {total > 9 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
          <Button variant="outlined" size="small" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Typography variant="body2" sx={{ px: 2, py: 0.8 }}>Page {page}</Typography>
          <Button variant="outlined" size="small" disabled={jobs.length < 9} onClick={() => setPage(p => p + 1)}>Next</Button>
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editJob ? 'Edit Job' : 'Post New Job'}</DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField fullWidth label="Job Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Experience Required" placeholder="e.g. 3-5 years" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} required /></Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Job Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {['full-time','part-time','contract','remote','hybrid'].map((t) => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {['active','draft','paused','closed'].map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}><TextField fullWidth label="Min Salary (USD)" type="number" value={form['salary.min']} onChange={(e) => setForm({ ...form, 'salary.min': e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Max Salary (USD)" type="number" value={form['salary.max']} onChange={(e) => setForm({ ...form, 'salary.max': e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline rows={4} label="Job Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Requirements (one per line)" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Skills (comma-separated)" placeholder="React, Node.js, MongoDB" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setModalOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}
              sx={{ background: 'linear-gradient(135deg, #e94560, #c73652)', '&:hover': { background: 'linear-gradient(135deg, #c73652, #a02a42)' } }}>
              {saving ? 'Saving...' : editJob ? 'Update Job' : 'Post Job'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewJob} onClose={() => setViewJob(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{viewJob?.title}</DialogTitle>
        <DialogContent>
          {viewJob && (
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={viewJob.status} size="small" color={STATUS_COLOR[viewJob.status]} sx={{ textTransform: 'capitalize' }} />
                <Chip label={viewJob.type} size="small" color={TYPE_COLOR[viewJob.type]} variant="outlined" sx={{ textTransform: 'capitalize' }} />
              </Box>
              <Grid container spacing={2}>
                {[['Department', viewJob.department], ['Location', viewJob.location], ['Experience', viewJob.experience], ['Applicants', viewJob.applicantsCount]].map(([k, v]) => (
                  <Grid item xs={6} key={k}><Typography variant="caption" color="text.secondary">{k}</Typography><Typography variant="body2" fontWeight={600}>{v}</Typography></Grid>
                ))}
              </Grid>
              <Box><Typography variant="subtitle2" fontWeight={700} mb={1}>Description</Typography><Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{viewJob.description}</Typography></Box>
              {viewJob.requirements?.length > 0 && (
                <Box><Typography variant="subtitle2" fontWeight={700} mb={1}>Requirements</Typography><Stack spacing={0.5}>{viewJob.requirements.map((r, i) => <Typography key={i} variant="body2" color="text.secondary">• {r}</Typography>)}</Stack></Box>
              )}
              {viewJob.skills?.length > 0 && (
                <Box><Typography variant="subtitle2" fontWeight={700} mb={1}>Skills</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{viewJob.skills.map((s) => <Chip key={s} label={s} size="small" color="primary" variant="outlined" />)}</Box></Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setViewJob(null)} variant="outlined">Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
