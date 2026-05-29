import { useEffect, useState, useCallback } from 'react';
import { candidatesAPI, jobsAPI, applicationsAPI } from '../../api/services';
import { Button, Card, Badge, Modal, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { Upload, Search, Phone, MapPin, Briefcase, Plus, Eye, Trash2, Zap, AlertTriangle, Mail, GraduationCap, BookOpen, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
      setCandidates(res.data.candidates);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load candidates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCandidates(); }, [search, skillFilter, expFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('resume', acceptedFiles[0]);
      const res = await candidatesAPI.uploadResume(formData);
      setUploadResult(res.data);
      toast.success(res.data.aiParsed ? 'Resume parsed with AI!' : 'Resume uploaded');
      fetchCandidates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  const handleReparse = async (id) => {
    setReparsing(true);
    try {
      const res = await candidatesAPI.reparse(id);
      setViewCandidate(res.data.candidate);
      fetchCandidates();
      toast.success('AI re-parsed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reparse failed');
    } finally { setReparsing(false); }
  };

  const openViewCandidate = async (c) => {
    setViewCandidate(c);
    setViewLoading(true);
    try {
      const res = await candidatesAPI.getOne(c._id);
      setViewCandidate(res.data);
    } catch {} finally { setViewLoading(false); }
  };

  const handleApply = async () => {
    if (!selectedJob) return toast.error('Select a job');
    setApplying(true);
    try {
      await applicationsAPI.create({ jobId: selectedJob, candidateId: applyModal._id });
      toast.success('Application created!');
      setApplyModal(null);
      setSelectedJob('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally { setApplying(false); }
  };

  const openApplyModal = async (candidate) => {
    setApplyModal(candidate);
    try {
      const res = await jobsAPI.getAll({ status: 'active', limit: 100 });
      setJobs(res.data.jobs);
    } catch { toast.error('Failed to load jobs'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this candidate?')) return;
    try { await candidatesAPI.delete(id); toast.success('Deleted'); fetchCandidates(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by name, skill, summary..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <input
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36"
            placeholder="Skill (e.g. React)"
            value={skillFilter}
            onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }}
          />
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={expFilter}
            onChange={(e) => { setExpFilter(e.target.value); setPage(1); }}
          >
            <option value="">Any Experience</option>
            <option value="0">Fresher (0 yrs)</option>
            <option value="1">1+ years</option>
            <option value="2">2+ years</option>
            <option value="3">3+ years</option>
            <option value="5">5+ years</option>
            <option value="8">8+ years</option>
          </select>
        </div>
        <Button onClick={() => { setUploadModal(true); setUploadResult(null); }}>
          <Upload className="w-4 h-4 mr-1" />Upload Resume
        </Button>
      </div>

      <p className="text-sm text-gray-500">{total} candidate{total !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : candidates.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-400">No candidates yet. Upload a resume to get started!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <Card key={c._id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                  {c.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{c.name || 'Unknown'}</h3>
                  {!isPlaceholderEmail(c.email) && (
                    <p className="text-xs text-gray-500 truncate">{c.email}</p>
                  )}
                </div>
                {c.aiParsed && (
                  <span title="AI Parsed" className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex-shrink-0">
                    <Zap className="w-3 h-3" />AI
                  </span>
                )}
              </div>
              <div className="space-y-1 mb-3">
                {c.phone && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="w-3 h-3" />{c.phone}</div>}
                {c.location && <div className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin className="w-3 h-3" />{c.location}</div>}
                {c.totalExperienceYears > 0 && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Briefcase className="w-3 h-3" />{c.totalExperienceYears} yrs exp</div>}
              </div>
              {c.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.skills.slice(0, 4).map((s) => <Badge key={s} color="gray">{s}</Badge>)}
                  {c.skills.length > 4 && <Badge color="gray">+{c.skills.length - 4}</Badge>}
                </div>
              )}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => openViewCandidate(c)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600">
                  <Eye className="w-3.5 h-3.5" />View
                </button>
                {['admin', 'recruiter'].includes(user?.role) && (
                  <button onClick={() => openApplyModal(c)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600 ml-2">
                    <Plus className="w-3.5 h-3.5" />Apply
                  </button>
                )}
                {user?.role === 'admin' && (
                  <button onClick={() => handleDelete(c._id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 ml-auto">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {total > 10 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page}</span>
          <Button variant="secondary" size="sm" disabled={candidates.length < 10} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Upload Resume Modal */}
      <Modal isOpen={uploadModal} onClose={() => setUploadModal(false)} title="Upload Resume" size="md">
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="space-y-2">
                <Spinner />
                <p className="text-sm text-gray-500">Uploading & parsing with AI...</p>
                <p className="text-xs text-gray-400">This may take 10–20 seconds</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">{isDragActive ? 'Drop the file here' : 'Drag & drop or click to upload'}</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, TXT up to 5MB</p>
              </>
            )}
          </div>

          {uploadResult && (
            <div className={`p-4 rounded-lg ${uploadResult.isDuplicate ? 'bg-yellow-50 border border-yellow-200' : 'bg-emerald-50 border border-emerald-200'}`}>
              {uploadResult.isDuplicate && (
                <div className="flex items-center gap-2 mb-2 text-yellow-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Duplicate candidate detected</span>
                </div>
              )}
              <p className="text-sm font-medium text-gray-900">{uploadResult.candidate?.name || 'Candidate added'}</p>
              {!isPlaceholderEmail(uploadResult.candidate?.email) && (
                <p className="text-xs text-gray-500 mt-0.5">{uploadResult.candidate.email}</p>
              )}
              {uploadResult.aiParsed
                ? <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Zap className="w-3 h-3" />AI parsed successfully</p>
                : <div className="mt-2 space-y-1">
                    <p className="text-xs text-yellow-600">
                      {uploadResult.aiError?.includes('rate') || uploadResult.aiError?.includes('429')
                        ? '⏳ AI was rate-limited — resume saved. Click Reparse below.'
                        : uploadResult.aiError
                          ? `⚠ AI failed: ${uploadResult.aiError}`
                          : '⚠ Saved without AI parsing — resume text may be unreadable'}
                    </p>
                    <button
                      onClick={async () => {
                        setUploading(true);
                        try {
                          const res = await candidatesAPI.reparse(uploadResult.candidate._id);
                          setUploadResult((prev) => ({ ...prev, candidate: res.data.candidate, aiParsed: true, aiError: null }));
                          fetchCandidates();
                          toast.success('AI re-parsed successfully!');
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Reparse failed');
                        } finally { setUploading(false); }
                      }}
                      disabled={uploading}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" />{uploading ? 'Reparsing...' : 'Reparse with AI'}
                    </button>
                  </div>
              }
              {uploadResult.candidate?.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {uploadResult.candidate.skills.slice(0, 6).map((s) => <Badge key={s} color="indigo">{s}</Badge>)}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* View Candidate Modal */}
      <Modal isOpen={!!viewCandidate} onClose={() => setViewCandidate(null)} title="Candidate Profile" size="lg">
        {viewCandidate && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl flex-shrink-0">
                {viewCandidate.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900">{viewCandidate.name}</h3>
                  {viewCandidate.aiParsed && (
                    <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3" />AI Parsed
                    </span>
                  )}
                  {!viewCandidate.aiParsed && (
                    <button
                      onClick={() => handleReparse(viewCandidate._id)}
                      disabled={reparsing}
                      className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${reparsing ? 'animate-spin' : ''}`} />
                      {reparsing ? 'Reparsing...' : 'Reparse with AI'}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-1">
                  {!isPlaceholderEmail(viewCandidate.email) && (
                    <span className="flex items-center gap-1 text-sm text-gray-500"><Mail className="w-3.5 h-3.5" />{viewCandidate.email}</span>
                  )}
                  {viewCandidate.phone && (
                    <span className="flex items-center gap-1 text-sm text-gray-500"><Phone className="w-3.5 h-3.5" />{viewCandidate.phone}</span>
                  )}
                  {viewCandidate.location && (
                    <span className="flex items-center gap-1 text-sm text-gray-500"><MapPin className="w-3.5 h-3.5" />{viewCandidate.location}</span>
                  )}
                  {viewCandidate.totalExperienceYears > 0 && (
                    <span className="flex items-center gap-1 text-sm text-gray-500"><Briefcase className="w-3.5 h-3.5" />{viewCandidate.totalExperienceYears} yrs experience</span>
                  )}
                </div>
              </div>
              {viewLoading && <Spinner size="sm" />}
            </div>

            {/* Summary */}
            {viewCandidate.summary && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">Summary</p>
                <p className="text-sm text-gray-700 leading-relaxed">{viewCandidate.summary}</p>
              </div>
            )}

            {/* Skills */}
            {viewCandidate.skills?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-500" />Skills
                  <span className="text-xs font-normal text-gray-400">({viewCandidate.skills.length})</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {viewCandidate.skills.map((s) => <Badge key={s} color="indigo">{s}</Badge>)}
                </div>
              </div>
            )}

            {/* Experience */}
            {viewCandidate.experience?.filter(e => e.company || e.title).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-indigo-500" />Work Experience
                </p>
                <div className="space-y-2">
                  {viewCandidate.experience.filter(e => e.company || e.title).map((exp, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {exp.title || 'Role'}{exp.company ? ` — ${exp.company}` : ''}
                          </p>
                          {exp.duration && <p className="text-xs text-indigo-600 mt-0.5">{exp.duration}</p>}
                        </div>
                      </div>
                      {exp.description && (
                        <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {viewCandidate.education?.filter(e => e.institution || e.degree).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />Education
                </p>
                <div className="space-y-2">
                  {viewCandidate.education.filter(e => e.institution || e.degree).map((edu, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {[edu.degree, edu.field].filter(Boolean).join(' in ') || 'Degree'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {edu.institution}{edu.year ? ` · ${edu.year}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No data fallback */}
            {!viewCandidate.summary && !viewCandidate.skills?.length && !viewCandidate.experience?.length && !viewCandidate.education?.length && (
              <div className="text-center py-6 text-gray-400 text-sm">
                <p>No detailed profile data extracted.</p>
                <p className="text-xs mt-1">The resume may be image-based or unreadable by the parser.</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Apply to Job Modal */}
      <Modal isOpen={!!applyModal} onClose={() => { setApplyModal(null); setSelectedJob(''); }} title={`Apply ${applyModal?.name} to Job`} size="sm">
        <div className="space-y-4">
          <select
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
          >
            <option value="">Select a job...</option>
            {jobs.map((j) => <option key={j._id} value={j._id}>{j.title} — {j.department}</option>)}
          </select>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setApplyModal(null); setSelectedJob(''); }}>Cancel</Button>
            <Button onClick={handleApply} loading={applying}>Create Application</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
