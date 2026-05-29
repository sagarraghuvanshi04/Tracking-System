import { useEffect, useState } from 'react';
import { applicationsAPI, jobsAPI } from '../../api/services';
import { Button, Card, Badge, Modal, StageBadge, ScoreRing, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';
import { Search, Star, Zap, MessageSquare, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const STAGES = ['applied', 'screening', 'interview', 'technical', 'offer', 'hired', 'rejected'];

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
      setApplications(res.data.applications);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApplications(); }, [jobFilter, stageFilter, shortlistedOnly, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    jobsAPI.getAll({ limit: 100 }).then((res) => setJobs(res.data.jobs)).catch(() => {});
  }, []);

  const handleStageChange = async (appId, stage) => {
    setStageUpdating(true);
    try {
      await applicationsAPI.updateStage(appId, { stage });
      toast.success('Stage updated');
      fetchApplications();
      if (viewApp?._id === appId) {
        const res = await applicationsAPI.getOne(appId);
        setViewApp(res.data);
      }
    } catch { toast.error('Failed to update stage'); }
    finally { setStageUpdating(false); }
  };

  const handleShortlist = async (appId) => {
    try {
      await applicationsAPI.toggleShortlist(appId);
      fetchApplications();
      if (viewApp?._id === appId) {
        const res = await applicationsAPI.getOne(appId);
        setViewApp(res.data);
      }
    } catch { toast.error('Failed to update shortlist'); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await applicationsAPI.addNote(viewApp._id, noteText);
      setViewApp(res.data);
      setNoteText('');
      toast.success('Note added');
    } catch { toast.error('Failed to add note'); }
    finally { setAddingNote(false); }
  };

  const handleRescore = async (appId) => {
    setRescoring(true);
    try {
      const res = await applicationsAPI.rescore(appId);
      toast.success('AI rescoring complete!');
      fetchApplications();
      if (viewApp?._id === appId) setViewApp(res.data.application);
    } catch (err) { toast.error(err.response?.data?.message || 'Rescoring failed'); }
    finally { setRescoring(false); }
  };

  const recommendationColor = { 'Strong Hire': 'green', 'Hire': 'green', 'Maybe': 'yellow', 'No Hire': 'red' };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
            value={jobFilter}
            onChange={(e) => { setJobFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Jobs</option>
            {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
          </select>
        </div>
        <select
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          value={stageFilter}
          onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Stages</option>
          {STAGES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <button
          onClick={() => { setShortlistedOnly(!shortlistedOnly); setPage(1); }}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${shortlistedOnly ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
        >
          <Star className="w-4 h-4" />Shortlisted
        </button>
        <span className="text-sm text-gray-500 ml-auto">{total} applications</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : applications.length === 0 ? (
        <Card className="p-12 text-center"><p className="text-gray-400">No applications found.</p></Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app._id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                  {app.candidate?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">{app.candidate?.name}</p>
                    {app.isShortlisted && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    {app.aiScore > 0 && <ScoreRing score={app.aiScore} size={36} />}
                  </div>
                  <p className="text-xs text-gray-500">{app.job?.title} · {app.job?.department}</p>
                  <p className="text-xs text-gray-400">{app.candidate?.email}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {app.aiRecommendation && (
                    <Badge color={recommendationColor[app.aiRecommendation] || 'gray'}>{app.aiRecommendation}</Badge>
                  )}
                  <StageBadge stage={app.stage} />
                  <button
                    onClick={() => { setViewApp(app); setNoteText(''); }}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    View
                  </button>
                </div>
              </div>
              {/* Inline AI match info on card */}
              <div className="flex flex-wrap items-center gap-2 mt-2 pl-14">
                {app.aiScore > 0 && (
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {app.aiScore}% Match
                  </span>
                )}
                {app.aiScoreBreakdown?.skillsMatch > 0 && (
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Skills {app.aiScoreBreakdown.skillsMatch}%
                  </span>
                )}
                {app.aiKeywords?.slice(0, 3).map((k) => (
                  <span key={k} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{k}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {total > 12 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page}</span>
          <Button variant="secondary" size="sm" disabled={applications.length < 12} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Application Detail Modal */}
      <Modal isOpen={!!viewApp} onClose={() => setViewApp(null)} title="Application Details" size="xl">
        {viewApp && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl flex-shrink-0">
                {viewApp.candidate?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{viewApp.candidate?.name}</h3>
                <p className="text-sm text-gray-500">{viewApp.candidate?.email}</p>
                <p className="text-sm text-gray-500">{viewApp.job?.title}</p>
              </div>
              {viewApp.aiScore > 0 && <ScoreRing score={viewApp.aiScore} size={56} />}
            </div>

            {/* AI Score Breakdown */}
            {viewApp.aiScore > 0 && (
              <div className="bg-indigo-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-indigo-900">AI Analysis</span>
                  </div>
                  {viewApp.aiRecommendation && (
                    <Badge color={recommendationColor[viewApp.aiRecommendation] || 'gray'}>{viewApp.aiRecommendation}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Skills Match', viewApp.aiScoreBreakdown?.skillsMatch],
                    ['Experience', viewApp.aiScoreBreakdown?.experienceMatch],
                    ['Education', viewApp.aiScoreBreakdown?.educationMatch],
                    ['Overall Fit', viewApp.aiScoreBreakdown?.overallFit],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{label}</span>
                        <span className="font-medium text-gray-900">{val || 0}%</span>
                      </div>
                      <div className="h-1.5 bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${val || 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {['admin', 'recruiter'].includes(user?.role) && (
                  <Button size="sm" variant="ghost" className="mt-3 text-indigo-600" loading={rescoring} onClick={() => handleRescore(viewApp._id)}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />Re-score with AI
                  </Button>
                )}
              </div>
            )}

            {/* Stage & Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Stage:</span>
                {['admin', 'recruiter'].includes(user?.role) ? (
                  <select
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={viewApp.stage}
                    onChange={(e) => handleStageChange(viewApp._id, e.target.value)}
                    disabled={stageUpdating}
                  >
                    {STAGES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                ) : (
                  <span className="px-3 py-1.5 text-sm font-medium text-gray-700 capitalize">{viewApp.stage}</span>
                )}
              </div>
              {['admin', 'recruiter'].includes(user?.role) && (
                <button
                  onClick={() => handleShortlist(viewApp._id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${viewApp.isShortlisted ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'border-gray-300 text-gray-600 hover:bg-yellow-50'}`}
                >
                  <Star className={`w-4 h-4 ${viewApp.isShortlisted ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  {viewApp.isShortlisted ? 'Shortlisted' : 'Shortlist'}
                </button>
              )}
            </div>

            {/* Keywords */}
            {viewApp.aiKeywords?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">AI Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {viewApp.aiKeywords.map((k) => (
                    <span key={k} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Stage History */}
            {viewApp.stageHistory?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Stage History</p>
                <div className="space-y-1">
                  {viewApp.stageHistory.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                      <StageBadge stage={h.stage} />
                      <span>by {h.changedBy?.name || 'System'}</span>
                      <span>· {format(new Date(h.changedAt), 'MMM d, HH:mm')}</span>
                      {h.note && <span className="text-gray-400">— {h.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
              {viewApp.notes?.length > 0 && (
                <div className="space-y-2 mb-3">
                  {viewApp.notes.map((note, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{note.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{note.addedBy?.name} · {format(new Date(note.createdAt), 'MMM d, HH:mm')}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <textarea
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={2}
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <Button size="sm" onClick={handleAddNote} loading={addingNote} disabled={!noteText.trim()}>
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
