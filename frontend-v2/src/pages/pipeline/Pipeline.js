import { useEffect, useState } from 'react';
import { applicationsAPI, jobsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Typography, Chip, CircularProgress, TextField, MenuItem,
} from '@mui/material';
import { Star, ChevronRight, ChevronLeft, BoltRounded } from '@mui/icons-material';
import toast from 'react-hot-toast';

const STAGES = ['applied','screening','interview','technical','offer','hired','rejected'];
const STAGE_META = {
  applied:   { color: '#6366f1', bg: '#eef2ff' },
  screening: { color: '#f59e0b', bg: '#fffbeb' },
  interview: { color: '#8b5cf6', bg: '#f5f3ff' },
  technical: { color: '#f97316', bg: '#fff7ed' },
  offer:     { color: '#3b82f6', bg: '#eff6ff' },
  hired:     { color: '#10b981', bg: '#ecfdf5' },
  rejected:  { color: '#ef4444', bg: '#fef2f2' },
};

export default function Pipeline() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobFilter, setJobFilter] = useState('');
  const [jobs, setJobs] = useState([]);
  const [moving, setMoving] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (jobFilter) params.jobId = jobFilter;
      const res = await applicationsAPI.getAll(params);
      setApplications(res.data.applications);
    } catch { toast.error('Failed to load pipeline'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [jobFilter]); // eslint-disable-line
  useEffect(() => { jobsAPI.getAll({ limit: 100 }).then((r) => setJobs(r.data.jobs)).catch(() => {}); }, []);

  const moveStage = async (app, direction) => {
    const idx = STAGES.indexOf(app.stage);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= STAGES.length) return;
    setMoving(app._id);
    try {
      await applicationsAPI.updateStage(app._id, { stage: STAGES[newIdx] });
      setApplications((prev) => prev.map((a) => (a._id === app._id ? { ...a, stage: STAGES[newIdx] } : a)));
    } catch { toast.error('Failed to move stage'); }
    finally { setMoving(null); }
  };

  const grouped = STAGES.reduce((acc, s) => { acc[s] = applications.filter((a) => a.stage === s); return acc; }, {});

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TextField select size="small" value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} sx={{ minWidth: 220 }} label="Filter by Job">
          <MenuItem value="">All Jobs</MenuItem>
          {jobs.map((j) => <MenuItem key={j._id} value={j._id}>{j.title}</MenuItem>)}
        </TextField>
        <Typography variant="caption" color="text.secondary">{applications.length} total applications</Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>
      ) : (
        <Box sx={{ overflowX: 'auto', pb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, minWidth: 'max-content' }}>
            {STAGES.map((stage) => {
              const meta = STAGE_META[stage];
              return (
                <Box key={stage} sx={{ width: 240, flexShrink: 0 }}>
                  {/* Column Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderRadius: '12px 12px 0 0', bgcolor: meta.color, mb: 0 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#fff', textTransform: 'capitalize', letterSpacing: '0.02em' }}>{stage}</Typography>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.25)', borderRadius: 10, px: 1, py: 0.2 }}>
                      <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.7rem' }}>{grouped[stage].length}</Typography>
                    </Box>
                  </Box>
                  {/* Cards */}
                  <Box sx={{ minHeight: 280, bgcolor: meta.bg, border: `1px solid ${meta.color}30`, borderTop: 'none', borderRadius: '0 0 12px 12px', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {grouped[stage].length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', py: 4, display: 'block' }}>No candidates</Typography>
                    )}
                    {grouped[stage].map((app) => (
                      <Box key={app._id} sx={{ bgcolor: '#fff', borderRadius: 2, p: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }, transition: 'box-shadow 0.2s' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {app.isShortlisted && <Star sx={{ fontSize: 12, color: '#f59e0b' }} />}
                              <Typography variant="caption" fontWeight={700} noWrap>{app.candidate?.name}</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem' }}>{app.job?.title}</Typography>
                          </Box>
                          {app.aiScore > 0 && (
                            <Box sx={{ bgcolor: 'rgba(233,69,96,0.1)', borderRadius: 1.5, px: 0.8, py: 0.3, ml: 0.5 }}>
                              <Typography variant="caption" sx={{ color: '#e94560', fontWeight: 800, fontSize: '0.7rem' }}>{app.aiScore}</Typography>
                            </Box>
                          )}
                        </Box>
                        {app.aiScore > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <BoltRounded sx={{ fontSize: 11, color: '#e94560' }} />
                            <Typography variant="caption" sx={{ color: '#e94560', fontSize: '0.65rem', fontWeight: 600 }}>{app.aiScore}% match</Typography>
                            {app.aiRecommendation && (
                              <Chip label={app.aiRecommendation} size="small" sx={{ fontSize: '0.6rem', height: 16, ml: 0.5 }} />
                            )}
                          </Box>
                        )}
                        {app.candidate?.skills?.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3, mb: 1 }}>
                            {app.candidate.skills.slice(0, 2).map((s) => <Chip key={s} label={s} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 16 }} />)}
                          </Box>
                        )}
                        {['admin','recruiter'].includes(user?.role) && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            {STAGES.indexOf(stage) > 0 && (
                              <Box component="button" disabled={moving === app._id} onClick={() => moveStage(app, -1)}
                                sx={{ border: 'none', bgcolor: '#f1f5f9', borderRadius: 1, p: 0.4, cursor: 'pointer', display: 'flex', alignItems: 'center', '&:hover': { bgcolor: '#e2e8f0' }, '&:disabled': { opacity: 0.4 } }}>
                                <ChevronLeft sx={{ fontSize: 14, color: '#64748b' }} />
                              </Box>
                            )}
                            {STAGES.indexOf(stage) < STAGES.length - 1 && (
                              <Box component="button" disabled={moving === app._id} onClick={() => moveStage(app, 1)}
                                sx={{ border: 'none', bgcolor: '#f1f5f9', borderRadius: 1, p: 0.4, cursor: 'pointer', display: 'flex', alignItems: 'center', '&:hover': { bgcolor: '#e2e8f0' }, '&:disabled': { opacity: 0.4 } }}>
                                <ChevronRight sx={{ fontSize: 14, color: '#64748b' }} />
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}
