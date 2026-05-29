import { useEffect, useState } from 'react';
import { candidatesAPI, jobsAPI, applicationsAPI, aiAPI } from '../../api/services';
import {
  Box, Card, CardContent, Typography, Button, Chip, Stack,
  TextField, MenuItem, CircularProgress, LinearProgress,
  Collapse, Avatar,
} from '@mui/material';
import { BoltRounded, Star, ExpandMore, ExpandLess, Warning } from '@mui/icons-material';
import toast from 'react-hot-toast';

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

function ExplainPanel({ applicationId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (data) { setOpen(!open); return; }
    setLoading(true);
    try { const res = await aiAPI.explain(applicationId); setData(res.data); setOpen(true); }
    catch { toast.error('AI explanation failed'); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f1f5f9' }}>
      <Button size="small" startIcon={<BoltRounded sx={{ fontSize: 14 }} />} endIcon={data ? (open ? <ExpandLess sx={{ fontSize: 14 }} /> : <ExpandMore sx={{ fontSize: 14 }} />) : null}
        onClick={load} disabled={loading} sx={{ color: '#e94560', fontSize: '0.75rem', fontWeight: 600 }}>
        {loading ? 'Analyzing...' : 'Explain AI Decision'}
      </Button>
      <Collapse in={open && !!data}>
        {data && (
          <Box sx={{ mt: 2, bgcolor: '#f8fafc', borderRadius: 2, p: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontStyle: 'italic' }}>{data.summary}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 1.5 }}>
              {data.whyHire?.length > 0 && (
                <Box><Typography variant="caption" fontWeight={700} color="#10b981" display="block" mb={0.5}>✓ Why Hire</Typography>
                  {data.whyHire.map((w, i) => <Typography key={i} variant="caption" color="text.secondary" display="block">• {w}</Typography>)}
                </Box>
              )}
              {data.concerns?.length > 0 && (
                <Box><Typography variant="caption" fontWeight={700} color="#ef4444" display="block" mb={0.5}>⚠ Concerns</Typography>
                  {data.concerns.map((c, i) => <Typography key={i} variant="caption" color="text.secondary" display="block">• {c}</Typography>)}
                </Box>
              )}
            </Box>
            {data.skillsPresent?.length > 0 && <Box mb={1}><Typography variant="caption" fontWeight={700} display="block" mb={0.5}>Skills Present</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{data.skillsPresent.map((s) => <Chip key={s} label={s} size="small" color="success" variant="outlined" sx={{ fontSize: '0.65rem' }} />)}</Box></Box>}
            {data.skillsMissing?.length > 0 && <Box mb={1}><Typography variant="caption" fontWeight={700} display="block" mb={0.5}>Skills Missing</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{data.skillsMissing.map((s) => <Chip key={s} label={s} size="small" color="error" variant="outlined" sx={{ fontSize: '0.65rem' }} />)}</Box></Box>}
            <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Confidence: <strong>{data.confidenceLevel}</strong></Typography>
              <Typography variant="caption" color="text.secondary">Verdict: <strong>{data.finalVerdict}</strong></Typography>
            </Box>
          </Box>
        )}
      </Collapse>
    </Box>
  );
}

export default function SmartShortlist() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [shortlist, setShortlist] = useState([]);
  const [jobInfo, setJobInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shortlisting, setShortlisting] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicates, setShowDuplicates] = useState(false);

  useEffect(() => {
    jobsAPI.getAll({ status: 'active', limit: 100 }).then((r) => setJobs(r.data.jobs)).catch(() => {});
    candidatesAPI.getDuplicates().then((r) => setDuplicates(r.data)).catch(() => {});
  }, []);

  const loadShortlist = async (jobId) => {
    if (!jobId) return;
    setLoading(true);
    try { const res = await candidatesAPI.getSmartShortlist(jobId); setShortlist(res.data.shortlist); setJobInfo(res.data.job); }
    catch { toast.error('Failed to load shortlist'); }
    finally { setLoading(false); }
  };

  const handleJobChange = (e) => { setSelectedJob(e.target.value); setShortlist([]); loadShortlist(e.target.value); };

  const handleShortlist = async (applicationId) => {
    setShortlisting(applicationId);
    try {
      await applicationsAPI.toggleShortlist(applicationId);
      setShortlist((prev) => prev.map((s) => s.applicationId === applicationId ? { ...s, isShortlisted: !s.isShortlisted } : s));
      toast.success('Shortlist updated');
    } catch { toast.error('Failed'); }
    finally { setShortlisting(null); }
  };

  return (
    <Box>
      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'linear-gradient(135deg, #e94560, #c73652)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BoltRounded sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>AI Smart Shortlisting</Typography>
              <Typography variant="caption" color="text.secondary">Candidates with score ≥ 60 are recommended</Typography>
            </Box>
            <Chip label="Powered by AI" size="small" sx={{ ml: 'auto', bgcolor: 'rgba(233,69,96,0.1)', color: '#e94560', fontWeight: 600 }} />
          </Box>
          <TextField select fullWidth label="Select a job to analyze" value={selectedJob} onChange={handleJobChange} sx={{ maxWidth: 400 }}>
            <MenuItem value="">Select a job...</MenuItem>
            {jobs.map((j) => <MenuItem key={j._id} value={j._id}>{j.title} — {j.department}</MenuItem>)}
          </TextField>
        </CardContent>
      </Card>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>}

      {!loading && selectedJob && shortlist.length === 0 && (
        <Card><CardContent sx={{ textAlign: 'center', py: 8 }}><Typography color="text.secondary">No scored candidates yet. Create applications and run AI scoring first.</Typography></CardContent></Card>
      )}

      {!loading && shortlist.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>{shortlist.length} Recommended Candidates</Typography>
            {jobInfo && <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{jobInfo.skills?.slice(0, 4).map((s) => <Chip key={s} label={s} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem' }} />)}</Box>}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
            {shortlist.map((item) => (
              <Card key={item.applicationId}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#1a1a2e', fontWeight: 700 }}>{item.candidate?.name?.charAt(0)?.toUpperCase()}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle2" fontWeight={700}>{item.candidate?.name}</Typography>
                        {item.aiRecommendation && <Chip label={item.aiRecommendation} size="small" color={REC_COLOR[item.aiRecommendation] || 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />}
                      </Box>
                      <Typography variant="caption" color="text.secondary">{item.candidate?.email}</Typography>
                      {item.candidate?.totalExperienceYears > 0 && <Typography variant="caption" color="text.secondary" display="block">{item.candidate.totalExperienceYears} yrs experience</Typography>}
                    </Box>
                    <Box sx={{ textAlign: 'center', bgcolor: 'rgba(233,69,96,0.08)', borderRadius: 2, p: 1.5, minWidth: 60 }}>
                      <Typography variant="h5" fontWeight={800} color="#e94560">{item.aiScore}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>AI Score</Typography>
                    </Box>
                  </Box>

                  <Stack spacing={1} mb={2}>
                    <ScoreBar label="Skills" value={item.scoreBreakdown?.skillsMatch} />
                    <ScoreBar label="Experience" value={item.scoreBreakdown?.experienceMatch} />
                    <ScoreBar label="Education" value={item.scoreBreakdown?.educationMatch} />
                    <ScoreBar label="Overall Fit" value={item.scoreBreakdown?.overallFit} />
                  </Stack>

                  {item.candidate?.skills?.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {item.candidate.skills.slice(0, 5).map((s) => <Chip key={s} label={s} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />)}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      size="small" startIcon={<Star sx={{ fontSize: 14, color: item.isShortlisted ? '#f59e0b' : undefined }} />}
                      variant={item.isShortlisted ? 'contained' : 'outlined'}
                      disabled={shortlisting === item.applicationId}
                      onClick={() => handleShortlist(item.applicationId)}
                      sx={item.isShortlisted ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)', fontSize: '0.75rem' } : { fontSize: '0.75rem' }}
                    >
                      {item.isShortlisted ? 'Shortlisted' : 'Shortlist'}
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', textTransform: 'capitalize' }}>Stage: {item.stage}</Typography>
                  </Box>

                  <ExplainPanel applicationId={item.applicationId} />
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Duplicates */}
      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => setShowDuplicates(!showDuplicates)}>
            <Warning sx={{ color: '#f59e0b', fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={700}>Duplicate Candidates</Typography>
            <Chip label={duplicates.length} size="small" sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 700 }} />
            <Box sx={{ ml: 'auto' }}>{showDuplicates ? <ExpandLess sx={{ color: '#94a3b8' }} /> : <ExpandMore sx={{ color: '#94a3b8' }} />}</Box>
          </Box>
          <Collapse in={showDuplicates}>
            <Box sx={{ mt: 2 }}>
              {duplicates.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No duplicates detected.</Typography>
              ) : (
                <Stack spacing={1}>
                  {duplicates.map((dup) => (
                    <Box key={dup._id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'rgba(245,158,11,0.06)', borderRadius: 2, border: '1px solid rgba(245,158,11,0.2)' }}>
                      <Warning sx={{ color: '#f59e0b', fontSize: 18, flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600}>{dup.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{dup.email}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">Duplicate of:</Typography>
                        <Typography variant="caption" fontWeight={600} display="block">{dup.duplicateOf?.name}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
}
