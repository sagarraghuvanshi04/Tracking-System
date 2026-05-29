import { useEffect, useState } from 'react';
import { applicationsAPI, jobsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Card, CardContent, Typography, Button, Chip, Stack,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, CircularProgress, InputAdornment, Divider, LinearProgress,
} from '@mui/material';
import { Search, Star, BoltRounded, Refresh, Message } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STAGES = ['applied','screening','interview','technical','offer','hired','rejected'];
const STAGE_COLOR = { applied: '#6366f1', screening: '#f59e0b', interview: '#8b5cf6', technical: '#f97316', offer: '#3b82f6', hired: '#10b981', rejected: '#ef4444' };
const REC_COLOR = { 'Strong Hire': 'success', 'Hire': 'success', 'Maybe': 'warning', 'No Hire': 'error' };

function ScoreBar({ label, value }) {
  const color = value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" fontWeight={700}>{value || 0}%</Typography>
      </Box>
      <LinearProgress variant="determinate" value={value || 0} sx={{ height: 5, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
    </Box>
  );
}

export default function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [jobFilter, setJobFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [shortlistedOnly, setShortlistedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [viewApp, setViewApp] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [stageUpdating, setStageUpdating] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (jobFilter) params.jobId = jobFilter;
      if (stageFilter) params.stage = stageFilter;
      if (shortlistedOnly) params.isShortlisted = true;
      const res = await applicationsAPI.getAll(params);
      setApplications(res.data.applications); setTotal(res.data.total);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApplications(); }, [jobFilter, stageFilter, shortlistedOnly, page]); // eslint-disable-line
  useEffect(() => { jobsAPI.getAll({ limit: 100 }).then((r) => setJobs(r.data.jobs)).catch(() => {}); }, []);

  const handleStageChange = async (appId, stage) => {
    setStageUpdating(true);
    try {
      await applicationsAPI.updateStage(appId, { stage }); toast.success('Stage updated'); fetchApplications();
      if (viewApp?._id === appId) { const res = await applicationsAPI.getOne(appId); setViewApp(res.data); }
    } catch { toast.error('Failed'); } finally { setStageUpdating(false); }
  };

  const handleShortlist = async (appId) => {
    try {
      await applicationsAPI.toggleShortlist(appId); fetchApplications();
      if (viewApp?._id === appId) { const res = await applicationsAPI.getOne(appId); setViewApp(res.data); }
    } catch { toast.error('Failed'); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try { const res = await applicationsAPI.addNote(viewApp._id, noteText); setViewApp(res.data); setNoteText(''); toast.success('Note added'); }
    catch { toast.error('Failed'); } finally { setAddingNote(false); }
  };

  const handleRescore = async (appId) => {
    setRescoring(true);
    try { const res = await applicationsAPI.rescore(appId); toast.success('Rescored!'); fetchApplications(); if (viewApp?._id === appId) setViewApp(res.data.application); }
    catch (err) { toast.error(err.response?.data?.message || 'Rescoring failed'); } finally { setRescoring(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField select size="small" value={jobFilter} onChange={(e) => { setJobFilter(e.target.value); setPage(1); }} sx={{ flex: 1, minWidth: 180 }} label="Filter by Job"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> } }}>
          <MenuItem value="">All Jobs</MenuItem>
          {jobs.map((j) => <MenuItem key={j._id} value={j._id}>{j.title}</MenuItem>)}
        </TextField>
        <TextField select size="small" value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setPage(1); }} sx={{ minWidth: 150 }} label="Stage">
          <MenuItem value="">All Stages</MenuItem>
          {STAGES.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
        </TextField>
        <Button
          variant={shortlistedOnly ? 'contained' : 'outlined'}
          startIcon={<Star sx={{ fontSize: 16 }} />}
          onClick={() => { setShortlistedOnly(!shortlistedOnly); setPage(1); }}
          size="small"
          sx={shortlistedOnly ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)', '&:hover': { background: 'linear-gradient(135deg, #d97706, #b45309)' } } : {}}
        >
          Shortlisted
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{total} applications</Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>
      ) : applications.length === 0 ? (
        <Card><CardContent sx={{ textAlign: 'center', py: 8 }}><Typography color="text.secondary">No applications found.</Typography></CardContent></Card>
      ) : (
        <Stack spacing={1.5}>
          {applications.map((app) => (
            <Card key={app._id} sx={{ '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }, transition: 'box-shadow 0.2s' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#1a1a2e', fontWeight: 700 }}>{app.candidate?.name?.charAt(0)?.toUpperCase()}</Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2" fontWeight={700}>{app.candidate?.name}</Typography>
                      {app.isShortlisted && <Star sx={{ fontSize: 16, color: '#f59e0b' }} />}
                      {app.aiScore > 0 && (
                        <Chip label={`${app.aiScore}% Match`} size="small" sx={{ bgcolor: 'rgba(233,69,96,0.1)', color: '#e94560', fontWeight: 700, fontSize: '0.7rem' }} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">{app.job?.title} · {app.job?.department}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    {app.aiRecommendation && <Chip label={app.aiRecommendation} size="small" color={REC_COLOR[app.aiRecommendation] || 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />}
                    <Chip label={app.stage} size="small" sx={{ bgcolor: `${STAGE_COLOR[app.stage]}20`, color: STAGE_COLOR[app.stage], fontWeight: 600, fontSize: '0.7rem', textTransform: 'capitalize' }} />
                    <Button size="small" onClick={() => { setViewApp(app); setNoteText(''); }} sx={{ color: '#e94560', fontSize: '0.75rem', fontWeight: 600 }}>View</Button>
                  </Box>
                </Box>
                {app.aiScore > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5, pl: 7 }}>
                    {app.aiScoreBreakdown?.skillsMatch > 0 && <Chip label={`Skills ${app.aiScoreBreakdown.skillsMatch}%`} size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.65rem' }} />}
                    {app.aiKeywords?.slice(0, 3).map((k) => <Chip key={k} label={k} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />)}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {total > 12 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
          <Button variant="outlined" size="small" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Typography variant="body2" sx={{ px: 2, py: 0.8 }}>Page {page}</Typography>
          <Button variant="outlined" size="small" disabled={applications.length < 12} onClick={() => setPage(p => p + 1)}>Next</Button>
        </Box>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!viewApp} onClose={() => setViewApp(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Application Details</DialogTitle>
        <DialogContent>
          {viewApp && (
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar sx={{ width: 52, height: 52, bgcolor: '#1a1a2e', fontSize: '1.2rem', fontWeight: 700 }}>{viewApp.candidate?.name?.charAt(0)}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700}>{viewApp.candidate?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{viewApp.candidate?.email}</Typography>
                  <Typography variant="body2" color="text.secondary">{viewApp.job?.title}</Typography>
                </Box>
                {viewApp.aiScore > 0 && (
                  <Box sx={{ textAlign: 'center', bgcolor: 'rgba(233,69,96,0.08)', borderRadius: 2, p: 1.5, minWidth: 70 }}>
                    <Typography variant="h5" fontWeight={800} color="#e94560">{viewApp.aiScore}</Typography>
                    <Typography variant="caption" color="text.secondary">AI Score</Typography>
                  </Box>
                )}
              </Box>

              {viewApp.aiScore > 0 && (
                <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BoltRounded sx={{ color: '#e94560', fontSize: 18 }} /><Typography variant="subtitle2" fontWeight={700}>AI Analysis</Typography></Box>
                    {viewApp.aiRecommendation && <Chip label={viewApp.aiRecommendation} size="small" color={REC_COLOR[viewApp.aiRecommendation] || 'default'} sx={{ fontWeight: 600 }} />}
                  </Box>
                  <Stack spacing={1.5}>
                    <ScoreBar label="Skills Match" value={viewApp.aiScoreBreakdown?.skillsMatch} />
                    <ScoreBar label="Experience" value={viewApp.aiScoreBreakdown?.experienceMatch} />
                    <ScoreBar label="Education" value={viewApp.aiScoreBreakdown?.educationMatch} />
                    <ScoreBar label="Overall Fit" value={viewApp.aiScoreBreakdown?.overallFit} />
                  </Stack>
                  {['admin','recruiter'].includes(user?.role) && (
                    <Button size="small" startIcon={<Refresh sx={{ fontSize: 14 }} />} disabled={rescoring} onClick={() => handleRescore(viewApp._id)} sx={{ mt: 2, color: '#e94560', fontSize: '0.75rem' }}>
                      {rescoring ? 'Rescoring...' : 'Re-score with AI'}
                    </Button>
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">Stage:</Typography>
                  {['admin','recruiter'].includes(user?.role) ? (
                    <TextField select size="small" value={viewApp.stage} onChange={(e) => handleStageChange(viewApp._id, e.target.value)} disabled={stageUpdating} sx={{ minWidth: 140 }}>
                      {STAGES.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
                    </TextField>
                  ) : <Chip label={viewApp.stage} size="small" sx={{ textTransform: 'capitalize' }} />}
                </Box>
                {['admin','recruiter'].includes(user?.role) && (
                  <Button
                    size="small" startIcon={<Star sx={{ fontSize: 14, color: viewApp.isShortlisted ? '#f59e0b' : undefined }} />}
                    variant={viewApp.isShortlisted ? 'contained' : 'outlined'}
                    onClick={() => handleShortlist(viewApp._id)}
                    sx={viewApp.isShortlisted ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)' } : {}}
                  >
                    {viewApp.isShortlisted ? 'Shortlisted' : 'Shortlist'}
                  </Button>
                )}
              </Box>

              {viewApp.aiKeywords?.length > 0 && (
                <Box><Typography variant="subtitle2" fontWeight={700} mb={1}>AI Keywords</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{viewApp.aiKeywords.map((k) => <Chip key={k} label={k} size="small" sx={{ bgcolor: 'rgba(233,69,96,0.08)', color: '#e94560', fontSize: '0.7rem' }} />)}</Box>
                </Box>
              )}

              {viewApp.stageHistory?.length > 0 && (
                <Box><Typography variant="subtitle2" fontWeight={700} mb={1}>Stage History</Typography>
                  <Stack spacing={0.5}>{viewApp.stageHistory.map((h, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={h.stage} size="small" sx={{ bgcolor: `${STAGE_COLOR[h.stage]}20`, color: STAGE_COLOR[h.stage], fontSize: '0.65rem', textTransform: 'capitalize' }} />
                      <Typography variant="caption" color="text.secondary">by {h.changedBy?.name || 'System'} · {format(new Date(h.changedAt), 'MMM d, HH:mm')}</Typography>
                    </Box>
                  ))}</Stack>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Notes</Typography>
                {viewApp.notes?.length > 0 && (
                  <Stack spacing={1} mb={2}>{viewApp.notes.map((note, i) => (
                    <Box key={i} sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2 }}>
                      <Typography variant="body2">{note.text}</Typography>
                      <Typography variant="caption" color="text.secondary">{note.addedBy?.name} · {format(new Date(note.createdAt), 'MMM d, HH:mm')}</Typography>
                    </Box>
                  ))}</Stack>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField fullWidth multiline rows={2} size="small" placeholder="Add a note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                  <Button variant="contained" onClick={handleAddNote} disabled={addingNote || !noteText.trim()} sx={{ minWidth: 44, background: 'linear-gradient(135deg, #e94560, #c73652)' }}><Message sx={{ fontSize: 18 }} /></Button>
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setViewApp(null)} variant="outlined">Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
