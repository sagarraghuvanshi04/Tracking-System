import { useEffect, useState } from 'react';
import { applicationsAPI, jobsAPI } from '../../api/services';
import { ScoreRing, Spinner, Badge } from '../../components/ui';
import toast from 'react-hot-toast';
import { Star, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const STAGES = ['applied', 'screening', 'interview', 'technical', 'offer', 'hired', 'rejected'];
const STAGE_COLORS = {
  applied: 'border-blue-300 bg-blue-50',
  screening: 'border-yellow-300 bg-yellow-50',
  interview: 'border-purple-300 bg-purple-50',
  technical: 'border-orange-300 bg-orange-50',
  offer: 'border-indigo-300 bg-indigo-50',
  hired: 'border-emerald-300 bg-emerald-50',
  rejected: 'border-red-300 bg-red-50',
};
const STAGE_HEADER = {
  applied: 'bg-blue-500',
  screening: 'bg-yellow-500',
  interview: 'bg-purple-500',
  technical: 'bg-orange-500',
  offer: 'bg-indigo-500',
  hired: 'bg-emerald-500',
  rejected: 'bg-red-500',
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
  useEffect(() => {
    jobsAPI.getAll({ limit: 100 }).then((r) => setJobs(r.data.jobs)).catch(() => {});
  }, []);

  const moveStage = async (app, direction) => {
    const idx = STAGES.indexOf(app.stage);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= STAGES.length) return;
    const newStage = STAGES[newIdx];
    setMoving(app._id);
    try {
      await applicationsAPI.updateStage(app._id, { stage: newStage });
      setApplications((prev) =>
        prev.map((a) => (a._id === app._id ? { ...a, stage: newStage } : a))
      );
    } catch { toast.error('Failed to move stage'); }
    finally { setMoving(null); }
  };

  const grouped = STAGES.reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.stage === s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
        >
          <option value="">All Jobs</option>
          {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
        </select>
        <span className="text-sm text-gray-500">{applications.length} total applications</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {STAGES.map((stage) => (
              <div key={stage} className="w-64 flex-shrink-0">
                <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg text-white text-sm font-semibold ${STAGE_HEADER[stage]}`}>
                  <span className="capitalize">{stage}</span>
                  <span className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full">
                    {grouped[stage].length}
                  </span>
                </div>
                <div className={`min-h-64 rounded-b-lg border-2 ${STAGE_COLORS[stage]} p-2 space-y-2`}>
                  {grouped[stage].length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6">No candidates</p>
                  )}
                  {grouped[stage].map((app) => (
                    <div key={app._id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            {app.isShortlisted && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" title="Shortlisted" />}
                            <p className="text-sm font-medium text-gray-900 truncate">{app.candidate?.name}</p>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{app.job?.title}</p>
                        </div>
                        {app.aiScore > 0 && <ScoreRing score={app.aiScore} size={32} />}
                      </div>
                      {app.aiScore > 0 && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-xs font-semibold text-indigo-600">{app.aiScore}% match</span>
                          {app.aiRecommendation && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              app.aiRecommendation === 'Strong Hire' ? 'bg-emerald-100 text-emerald-700' :
                              app.aiRecommendation === 'Hire' ? 'bg-green-100 text-green-700' :
                              app.aiRecommendation === 'Maybe' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>{app.aiRecommendation}</span>
                          )}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {app.candidate?.skills?.slice(0, 2).map((s) => (
                          <Badge key={s} color="gray">{s}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="ml-auto flex gap-1">
                          {['admin', 'recruiter'].includes(user?.role) && STAGES.indexOf(stage) > 0 && (
                            <button
                              onClick={() => moveStage(app, -1)}
                              disabled={moving === app._id}
                              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-40"
                              title="Move back"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {['admin', 'recruiter'].includes(user?.role) && STAGES.indexOf(stage) < STAGES.length - 1 && (
                            <button
                              onClick={() => moveStage(app, 1)}
                              disabled={moving === app._id}
                              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-indigo-600 disabled:opacity-40"
                              title="Advance stage"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
