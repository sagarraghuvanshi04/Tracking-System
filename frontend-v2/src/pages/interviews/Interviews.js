import { useEffect, useState } from 'react';
import { interviewsAPI, applicationsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, Stack,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Divider, Alert,
} from '@mui/material';
import { Add, CalendarMonth, Schedule, VideoCall, Phone, Computer, LocationOn, Edit, Delete } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TYPE_ICON = { video: VideoCall, phone: Phone, technical: Computer, onsite: LocationOn };
const TYPE_COLOR = { video: 'info', phone: 'success', technical: 'secondary', onsite: 'warning' };
const STATUS_COLOR = { scheduled: 'info', completed: 'success', cancelled: 'error', rescheduled: 'warning' };
const EMPTY_FORM = { applicationId: '', scheduledAt: '', type: 'video', duration: 60, meetingLink: '', notes: '' };

export default function Interviews() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editInterview, setEditInterview] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [applications, setApplications] = useState([]);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const params = {};
      if (upcomingOnly) params.upcoming = true;
      const res = await interviewsAPI.getAll(params);
      setInterviews(res.data);
    } catch { toast.error('Failed to load interviews'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInterviews(); }, [upcomingOnly]); // eslint-disable-line

  const openCreate = async () => {
    setEditInterview(null); setForm(EMPTY_FORM); setModalOpen(true);
    try {
      const res = await applicationsAPI.getAll({ limit: 200 });
      setApplications(res.data.applications.filter((a) => a.stage !== 'rejected' && a.stage !== 'hired' && a.job && a.candidate));
    } catch { toast.error('Failed to load applications'); }
  };

  const openEdit = (interview) => {
    setEditInterview(interview);
    setForm({ applicationId: interview.application, scheduledAt: format(new Date(interview.scheduledAt), "yyyy-MM-dd'T'HH:mm"), type: interview.type, duration: interview.duration, meetingLink: interview.meetingLink || '', notes: interview.notes || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editInterview) { await interviewsAPI.update(editInterview._id, form); toast.success('Interview updated'); }
      else { await interviewsAPI.schedule(form); toast.success('Interview scheduled & invite sent!'); }
      setModalOpen(false); fetchInterviews();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this interview?')) return;
    try { await interviewsAPI.delete(id); toast.success('Deleted'); fetchInterviews(); }
    catch { toast.error('Delete failed'); }
  };

  const handleStatusUpdate = async (id, status) => {
    try { await interviewsAPI.update(id, { status }); toast.success('Status updated'); fetchInterviews(); }
    catch { toast.error('Update failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Button
          variant={upcomingOnly ? 'contained' : 'outlined'}
          startIcon={<CalendarMonth sx={{ fontSize: 16 }} />}
          onClick={() => setUpcomingOnly(!upcomingOnly)}
          size="small"
          sx={upcomingOnly ? { background: 'linear-gradient(135deg, #1a1a2e, #16213e)' } : {}}
        >
          Upcoming Only
        </Button>
        {['admin','recruiter'].includes(user?.role) && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}
            sx={{ background: 'linear-gradient(135deg, #e94560, #c73652)', '&:hover': { background: 'linear-gradient(135deg, #c73652, #a02a42)' } }}>
            Schedule Interview
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>
      ) : interviews.length === 0 ? (
        <Card><CardContent sx={{ textAlign: 'center', py: 8 }}><Typography color="text.secondary">No interviews scheduled yet.</Typography></CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {interviews.map((interview) => {
            const TypeIcon = TYPE_ICON[interview.type] || VideoCall;
            return (
              <Grid item xs={12} md={6} xl={4} key={interview._id}>
                <Card sx={{ '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }, transition: 'box-shadow 0.2s' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>{interview.candidate?.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{interview.job?.title}</Typography>
                      </Box>
                      <Chip label={interview.status} size="small" color={STATUS_COLOR[interview.status]} sx={{ fontWeight: 600, textTransform: 'capitalize' }} />
                    </Box>
                    <Stack spacing={0.8} mb={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><CalendarMonth sx={{ fontSize: 14, color: '#94a3b8' }} /><Typography variant="caption" color="text.secondary">{format(new Date(interview.scheduledAt), 'MMM d, yyyy')}</Typography></Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Schedule sx={{ fontSize: 14, color: '#94a3b8' }} /><Typography variant="caption" color="text.secondary">{format(new Date(interview.scheduledAt), 'h:mm a')} · {interview.duration} min</Typography></Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><TypeIcon sx={{ fontSize: 14, color: '#94a3b8' }} /><Chip label={interview.type} size="small" color={TYPE_COLOR[interview.type]} variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} /></Box>
                      {interview.meetingLink && <Typography variant="caption" component="a" href={interview.meetingLink} target="_blank" rel="noreferrer" sx={{ color: '#e94560', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Join Meeting</Typography>}
                    </Stack>
                    <Divider sx={{ mb: 1.5 }} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {interview.status === 'scheduled' && <Button size="small" onClick={() => handleStatusUpdate(interview._id, 'completed')} sx={{ color: '#10b981', fontSize: '0.75rem' }}>Mark Done</Button>}
                      {['admin','recruiter'].includes(user?.role) && (
                        <>
                          <Button size="small" startIcon={<Edit sx={{ fontSize: 13 }} />} onClick={() => openEdit(interview)} sx={{ color: '#64748b', fontSize: '0.75rem', ml: 'auto' }}>Edit</Button>
                          <Button size="small" startIcon={<Delete sx={{ fontSize: 13 }} />} onClick={() => handleDelete(interview._id)} sx={{ color: '#ef4444', fontSize: '0.75rem' }}>Delete</Button>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>{editInterview ? 'Edit Interview' : 'Schedule Interview'}</DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent>
            <Stack spacing={2.5}>
              {!editInterview && (
                <Box>
                  <TextField select fullWidth label="Application" value={form.applicationId} onChange={(e) => setForm({ ...form, applicationId: e.target.value })} required>
                    <MenuItem value="">Select application...</MenuItem>
                    {applications.map((a) => <MenuItem key={a._id} value={a._id}>{a.candidate?.name} — {a.job?.title} ({a.stage})</MenuItem>)}
                  </TextField>
                  {applications.length === 0 && <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }}>No eligible applications. Go to Candidates → Apply first.</Alert>}
                </Box>
              )}
              <TextField fullWidth label="Date & Time" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required InputLabelProps={{ shrink: true }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField select fullWidth label="Interview Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {['video','phone','technical','onsite'].map((t) => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
                </TextField>
                <TextField fullWidth label="Duration (minutes)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              </Box>
              <TextField fullWidth label="Meeting Link (optional)" placeholder="https://meet.google.com/..." value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} />
              <TextField fullWidth multiline rows={3} label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setModalOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}
              sx={{ background: 'linear-gradient(135deg, #e94560, #c73652)', '&:hover': { background: 'linear-gradient(135deg, #c73652, #a02a42)' } }}>
              {saving ? 'Saving...' : editInterview ? 'Update' : 'Schedule'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
