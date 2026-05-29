import { useEffect, useState, useCallback } from 'react';
import { candidatesAPI, jobsAPI, applicationsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, Stack,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, CircularProgress, InputAdornment, Divider, Alert, LinearProgress,
} from '@mui/material';
import {
  Search, Upload, Phone, LocationOn, Work, Add, Visibility,
  Delete, BoltRounded, Warning, Email, School, Refresh,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

const isPlaceholderEmail = (email) => !email || email.includes('@noemail.local');

export default function Candidates() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [expFilter, setExpFilter] = useState('');
  const [page, setPage] = useState(1);
  const [uploadModal, setUploadModal] = useState(false);
  const [viewCandidate, setViewCandidate] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [applyModal, setApplyModal] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [reparsing, setReparsing] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = { search, page, limit: 10 };
      if (skillFilter) params.skills = skillFilter;
      if (expFilter) params.minExp = expFilter;
      const res = await candidatesAPI.getAll(params);
      setCandidates(res.data.candidates); setTotal(res.data.total);
    } catch { toast.error('Failed to load candidates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCandidates(); }, [search, skillFilter, expFilter, page]); // eslint-disable-line

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    setUploading(true); setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('resume', acceptedFiles[0]);
      const res = await candidatesAPI.uploadResume(formData);
      setUploadResult(res.data);
      toast.success(res.data.aiParsed ? 'Resume parsed with AI!' : 'Resume uploaded');
      fetchCandidates();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  }, []); // eslint-disable-line

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
  });

  const handleReparse = async (id) => {
    setReparsing(true);
    try {
      const res = await candidatesAPI.reparse(id);
      setViewCandidate(res.data.candidate); fetchCandidates();
      toast.success('AI re-parsed successfully!');
    } catch (err) { toast.error(err.response?.data?.message || 'Reparse failed'); }
    finally { setReparsing(false); }
  };

  const openViewCandidate = async (c) => {
    setViewCandidate(c); setViewLoading(true);
    try { const res = await candidatesAPI.getOne(c._id); setViewCandidate(res.data); }
    catch {} finally { setViewLoading(false); }
  };

  const handleApply = async () => {
    if (!selectedJob) return toast.error('Select a job');
    setApplying(true);
    try {
      await applicationsAPI.create({ jobId: selectedJob, candidateId: applyModal._id });
      toast.success('Application created!'); setApplyModal(null); setSelectedJob('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to apply'); }
    finally { setApplying(false); }
  };

  const openApplyModal = async (candidate) => {
    setApplyModal(candidate);
    try { const res = await jobsAPI.getAll({ status: 'active', limit: 100 }); setJobs(res.data.jobs); }
    catch { toast.error('Failed to load jobs'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this candidate?')) return;
    try { await candidatesAPI.delete(id); toast.success('Deleted'); fetchCandidates(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField placeholder="Search candidates..." size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} sx={{ flex: 1, minWidth: 200 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> } }} />
        <TextField size="small" placeholder="Skill (e.g. React)" value={skillFilter} onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }} sx={{ width: 160 }} />
        <TextField select size="small" value={expFilter} onChange={(e) => { setExpFilter(e.target.value); setPage(1); }} sx={{ width: 160 }} label="Experience">
          <MenuItem value="">Any Experience</MenuItem>
          {[['0','Fresher'],['1','1+ years'],['2','2+ years'],['3','3+ years'],['5','5+ years'],['8','8+ years']].map(([v,l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
        <Button variant="contained" startIcon={<Upload />} onClick={() => { setUploadModal(true); setUploadResult(null); }}
          sx={{ background: 'linear-gradient(135deg, #e94560, #c73652)', '&:hover': { background: 'linear-gradient(135deg, #c73652, #a02a42)' } }}>
          Upload Resume
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>{total} candidate{total !== 1 ? 's' : ''}</Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#e94560' }} /></Box>
      ) : candidates.length === 0 ? (
        <Card><CardContent sx={{ textAlign: 'center', py: 8 }}><Typography color="text.secondary">No candidates yet. Upload a resume to get started!</Typography></CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {candidates.map((c) => (
            <Grid item xs={12} md={6} xl={4} key={c._id}>
              <Card sx={{ '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }, transition: 'box-shadow 0.2s' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#1a1a2e', fontWeight: 700 }}>{c.name?.charAt(0)?.toUpperCase() || '?'}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>{c.name || 'Unknown'}</Typography>
                      {!isPlaceholderEmail(c.email) && <Typography variant="caption" color="text.secondary" noWrap>{c.email}</Typography>}
                    </Box>
                    {c.aiParsed && <Chip icon={<BoltRounded sx={{ fontSize: '14px !important' }} />} label="AI" size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem' }} />}
                  </Box>
                  <Stack spacing={0.5} mb={2}>
                    {c.phone && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Phone sx={{ fontSize: 13, color: '#94a3b8' }} /><Typography variant="caption" color="text.secondary">{c.phone}</Typography></Box>}
                    {c.location && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><LocationOn sx={{ fontSize: 13, color: '#94a3b8' }} /><Typography variant="caption" color="text.secondary">{c.location}</Typography></Box>}
                    {c.totalExperienceYears > 0 && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Work sx={{ fontSize: 13, color: '#94a3b8' }} /><Typography variant="caption" color="text.secondary">{c.totalExperienceYears} yrs exp</Typography></Box>}
                  </Stack>
                  {c.skills?.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {c.skills.slice(0, 4).map((s) => <Chip key={s} label={s} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />)}
                      {c.skills.length > 4 && <Chip label={`+${c.skills.length - 4}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />}
                    </Box>
                  )}
                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<Visibility sx={{ fontSize: 14 }} />} onClick={() => openViewCandidate(c)} sx={{ color: '#64748b', fontSize: '0.75rem' }}>View</Button>
                    {['admin','recruiter'].includes(user?.role) && <Button size="small" startIcon={<Add sx={{ fontSize: 14 }} />} onClick={() => openApplyModal(c)} sx={{ color: '#10b981', fontSize: '0.75rem' }}>Apply</Button>}
                    {user?.role === 'admin' && <Button size="small" startIcon={<Delete sx={{ fontSize: 14 }} />} onClick={() => handleDelete(c._id)} sx={{ color: '#ef4444', fontSize: '0.75rem', ml: 'auto' }}>Delete</Button>}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {total > 10 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
          <Button variant="outlined" size="small" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Typography variant="body2" sx={{ px: 2, py: 0.8 }}>Page {page}</Typography>
          <Button variant="outlined" size="small" disabled={candidates.length < 10} onClick={() => setPage(p => p + 1)}>Next</Button>
        </Box>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadModal} onClose={() => setUploadModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Upload Resume</DialogTitle>
        <DialogContent>
          <Box {...getRootProps()} sx={{ border: '2px dashed', borderColor: isDragActive ? '#e94560' : '#e2e8f0', borderRadius: 3, p: 5, textAlign: 'center', cursor: 'pointer', bgcolor: isDragActive ? 'rgba(233,69,96,0.04)' : '#fafafa', '&:hover': { borderColor: '#e94560', bgcolor: 'rgba(233,69,96,0.04)' }, transition: 'all 0.2s', mb: 2 }}>
            <input {...getInputProps()} />
            {uploading ? (
              <Box><CircularProgress sx={{ color: '#e94560', mb: 1 }} size={32} /><Typography variant="body2" color="text.secondary">Uploading & parsing with AI...</Typography><Typography variant="caption" color="text.secondary">This may take 10–20 seconds</Typography></Box>
            ) : (
              <Box><Upload sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} /><Typography variant="body2" fontWeight={600}>{isDragActive ? 'Drop the file here' : 'Drag & drop or click to upload'}</Typography><Typography variant="caption" color="text.secondary">PDF, DOC, DOCX, TXT up to 5MB</Typography></Box>
            )}
          </Box>
          {uploadResult && (
            <Alert severity={uploadResult.isDuplicate ? 'warning' : 'success'} sx={{ borderRadius: 2 }}>
              {uploadResult.isDuplicate && <Typography variant="caption" fontWeight={700} display="block">Duplicate candidate detected</Typography>}
              <Typography variant="body2" fontWeight={600}>{uploadResult.candidate?.name || 'Candidate added'}</Typography>
              {uploadResult.aiParsed ? (
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}><BoltRounded sx={{ fontSize: 12 }} />AI parsed successfully</Typography>
              ) : (
                <Box mt={0.5}>
                  <Typography variant="caption" display="block">{uploadResult.aiError?.includes('rate') ? '⏳ AI rate-limited — click Reparse below.' : `⚠ ${uploadResult.aiError || 'Saved without AI parsing'}`}</Typography>
                  <Button size="small" startIcon={<Refresh sx={{ fontSize: 14 }} />} disabled={uploading} onClick={async () => {
                    setUploading(true);
                    try { const res = await candidatesAPI.reparse(uploadResult.candidate._id); setUploadResult((p) => ({ ...p, candidate: res.data.candidate, aiParsed: true })); fetchCandidates(); toast.success('Reparsed!'); }
                    catch (err) { toast.error(err.response?.data?.message || 'Reparse failed'); }
                    finally { setUploading(false); }
                  }} sx={{ mt: 0.5, color: '#e94560', fontSize: '0.75rem' }}>Reparse with AI</Button>
                </Box>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setUploadModal(false)} variant="outlined">Close</Button></DialogActions>
      </Dialog>

      {/* View Candidate Modal */}
      <Dialog open={!!viewCandidate} onClose={() => setViewCandidate(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Candidate Profile</DialogTitle>
        <DialogContent>
          {viewCandidate && (
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: '#1a1a2e', fontSize: '1.4rem', fontWeight: 700 }}>{viewCandidate.name?.charAt(0)?.toUpperCase()}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6" fontWeight={700}>{viewCandidate.name}</Typography>
                    {viewCandidate.aiParsed ? <Chip icon={<BoltRounded sx={{ fontSize: '14px !important' }} />} label="AI Parsed" size="small" color="primary" variant="outlined" /> : (
                      <Button size="small" startIcon={<Refresh sx={{ fontSize: 14 }} />} disabled={reparsing} onClick={() => handleReparse(viewCandidate._id)} sx={{ color: '#e94560', fontSize: '0.75rem' }}>{reparsing ? 'Reparsing...' : 'Reparse with AI'}</Button>
                    )}
                  </Box>
                  <Stack direction="row" spacing={2} flexWrap="wrap" mt={0.5}>
                    {!isPlaceholderEmail(viewCandidate.email) && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Email sx={{ fontSize: 13, color: '#94a3b8' }} /><Typography variant="caption" color="text.secondary">{viewCandidate.email}</Typography></Box>}
                    {viewCandidate.phone && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Phone sx={{ fontSize: 13, color: '#94a3b8' }} /><Typography variant="caption" color="text.secondary">{viewCandidate.phone}</Typography></Box>}
                    {viewCandidate.location && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><LocationOn sx={{ fontSize: 13, color: '#94a3b8' }} /><Typography variant="caption" color="text.secondary">{viewCandidate.location}</Typography></Box>}
                  </Stack>
                </Box>
                {viewLoading && <CircularProgress size={20} sx={{ color: '#e94560' }} />}
              </Box>
              {viewCandidate.summary && <Box sx={{ bgcolor: 'rgba(233,69,96,0.05)', border: '1px solid rgba(233,69,96,0.15)', borderRadius: 2, p: 2 }}><Typography variant="caption" fontWeight={700} color="#e94560" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</Typography><Typography variant="body2" color="text.secondary" mt={0.5}>{viewCandidate.summary}</Typography></Box>}
              {viewCandidate.skills?.length > 0 && <Box><Typography variant="subtitle2" fontWeight={700} mb={1}>Skills ({viewCandidate.skills.length})</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{viewCandidate.skills.map((s) => <Chip key={s} label={s} size="small" color="primary" variant="outlined" />)}</Box></Box>}
              {viewCandidate.experience?.filter(e => e.company || e.title).length > 0 && (
                <Box><Typography variant="subtitle2" fontWeight={700} mb={1}>Work Experience</Typography>
                  <Stack spacing={1}>{viewCandidate.experience.filter(e => e.company || e.title).map((exp, i) => (
                    <Box key={i} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2" fontWeight={700}>{exp.title || 'Role'}{exp.company ? ` — ${exp.company}` : ''}</Typography>
                      {exp.duration && <Typography variant="caption" color="#e94560">{exp.duration}</Typography>}
                      {exp.description && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{exp.description}</Typography>}
                    </Box>
                  ))}</Stack>
                </Box>
              )}
              {viewCandidate.education?.filter(e => e.institution || e.degree).length > 0 && (
                <Box><Typography variant="subtitle2" fontWeight={700} mb={1}>Education</Typography>
                  <Stack spacing={1}>{viewCandidate.education.filter(e => e.institution || e.degree).map((edu, i) => (
                    <Box key={i} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2" fontWeight={700}>{[edu.degree, edu.field].filter(Boolean).join(' in ') || 'Degree'}</Typography>
                      <Typography variant="caption" color="text.secondary">{edu.institution}{edu.year ? ` · ${edu.year}` : ''}</Typography>
                    </Box>
                  ))}</Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setViewCandidate(null)} variant="outlined">Close</Button></DialogActions>
      </Dialog>

      {/* Apply Modal */}
      <Dialog open={!!applyModal} onClose={() => { setApplyModal(null); setSelectedJob(''); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Apply {applyModal?.name} to Job</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label="Select Job" value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} sx={{ mt: 1 }}>
            <MenuItem value="">Select a job...</MenuItem>
            {jobs.map((j) => <MenuItem key={j._id} value={j._id}>{j.title} — {j.department}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => { setApplyModal(null); setSelectedJob(''); }} variant="outlined">Cancel</Button>
          <Button onClick={handleApply} variant="contained" disabled={applying}
            sx={{ background: 'linear-gradient(135deg, #e94560, #c73652)', '&:hover': { background: 'linear-gradient(135deg, #c73652, #a02a42)' } }}>
            {applying ? 'Creating...' : 'Create Application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
