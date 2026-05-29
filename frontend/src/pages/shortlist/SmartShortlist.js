import { useEffect, useState } from 'react';
import { candidatesAPI, jobsAPI, applicationsAPI, aiAPI } from '../../api/services';
import { Card, ScoreRing, Badge, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';
import { Zap, Star, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const recColor = { 'Strong Hire': 'green', 'Hire': 'green', 'Maybe': 'yellow', 'No Hire': 'red' };

function ExplainPanel({ applicationId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (data) { setOpen(!open); return; }
    setLoading(true);
    try {
      const res = await aiAPI.explain(applicationId);
      setData(res.data);
      setOpen(true);
    } catch { toast.error('AI explanation failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        onClick={load}
        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <Zap className="w-3.5 h-3.5" />
        {loading ? 'Analyzing...' : 'Explain AI Decision'}
        {data && (open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>

      {open && data && (
        <div className="mt-3 space-y-3 text-xs">
          <p className="text-gray-700 bg-indigo-50 p-2 rounded-lg">{data.summary}</p>

          <div className="grid grid-cols-2 gap-3">
            {data.whyHire?.length > 0 && (
              <div>
                <p className="font-semibold text-emerald-700 mb-1">✓ Why Hire</p>
                <ul className="space-y-0.5">
                  {data.whyHire.map((w, i) => <li key={i} className="text-gray-600">• {w}</li>)}
                </ul>
              </div>
            )}
            {data.concerns?.length > 0 && (
              <div>
                <p className="font-semibold text-red-600 mb-1">⚠ Concerns</p>
                <ul className="space-y-0.5">
                  {data.concerns.map((c, i) => <li key={i} className="text-gray-600">• {c}</li>)}
                </ul>
              </div>
            )}
          </div>

          {data.skillsPresent?.length > 0 && (
            <div>
              <p className="font-semibold text-gray-700 mb-1">Skills Present</p>
              <div className="flex flex-wrap gap-1">
                {data.skillsPresent.map((s) => <Badge key={s} color="green">{s}</Badge>)}
              </div>
            </div>
          )}
          {data.skillsMissing?.length > 0 && (
            <div>
              <p className="font-semibold text-gray-700 mb-1">Skills Missing</p>
              <div className="flex flex-wrap gap-1">
                {data.skillsMissing.map((s) => <Badge key={s} color="red">{s}</Badge>)}
              </div>
            </div>
          )}

          {data.experienceInsights && (
            <p className="text-gray-600 italic">{data.experienceInsights}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <span className="text-gray-500">Confidence: <strong>{data.confidenceLevel}</strong></span>
            <span className="text-gray-500">Verdict: <strong>{data.finalVerdict}</strong></span>
          </div>
        </div>
      )}
    </div>
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
    try {
      const res = await candidatesAPI.getSmartShortlist(jobId);
      setShortlist(res.data.shortlist);
      setJobInfo(res.data.job);
    } catch { toast.error('Failed to load shortlist'); }
    finally { setLoading(false); }
  };

  const handleJobChange = (e) => {
    setSelectedJob(e.target.value);
    setShortlist([]);
    loadShortlist(e.target.value);
  };

  const handleShortlist = async (applicationId) => {
    setShortlisting(applicationId);
    try {
      await applicationsAPI.toggleShortlist(applicationId);
      setShortlist((prev) =>
        prev.map((s) => s.applicationId === applicationId ? { ...s, isShortlisted: !s.isShortlisted } : s)
      );
      toast.success('Shortlist updated');
    } catch { toast.error('Failed'); }
    finally { setShortlisting(null); }
  };

  return (
    <div className="space-y-6">
      {/* Job Selector */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">AI Smart Shortlisting</h2>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Powered by AI</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Select a job to see AI-ranked candidates with explainable scoring. Candidates with score ≥ 60 are recommended.
        </p>
        <select
          className="w-full max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          value={selectedJob}
          onChange={handleJobChange}
        >
          <option value="">Select a job to analyze...</option>
          {jobs.map((j) => <option key={j._id} value={j._id}>{j.title} — {j.department}</option>)}
        </select>
      </Card>

      {/* Shortlist Results */}
      {loading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

      {!loading && selectedJob && shortlist.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-gray-400 text-sm">No scored candidates yet for this job. Create applications and run AI scoring first.</p>
        </Card>
      )}

      {!loading && shortlist.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {shortlist.length} Recommended Candidates
            </h3>
            {jobInfo && (
              <div className="flex flex-wrap gap-1 ml-2">
                {jobInfo.skills?.slice(0, 4).map((s) => <Badge key={s} color="indigo">{s}</Badge>)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {shortlist.map((item) => (
              <Card key={item.applicationId} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                    {item.candidate?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{item.candidate?.name}</p>
                      {item.aiRecommendation && (
                        <Badge color={recColor[item.aiRecommendation] || 'gray'}>{item.aiRecommendation}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{item.candidate?.email}</p>
                    {item.candidate?.totalExperienceYears > 0 && (
                      <p className="text-xs text-gray-400">{item.candidate.totalExperienceYears} yrs experience</p>
                    )}
                  </div>
                  <ScoreRing score={item.aiScore} size={52} />
                </div>

                {/* Score Breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    ['Skills', item.scoreBreakdown?.skillsMatch],
                    ['Experience', item.scoreBreakdown?.experienceMatch],
                    ['Education', item.scoreBreakdown?.educationMatch],
                    ['Overall Fit', item.scoreBreakdown?.overallFit],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-gray-800">{val || 0}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${val || 0}%`,
                            background: (val || 0) >= 75 ? '#10b981' : (val || 0) >= 50 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {item.candidate?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.candidate.skills.slice(0, 5).map((s) => <Badge key={s} color="gray">{s}</Badge>)}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleShortlist(item.applicationId)}
                    disabled={shortlisting === item.applicationId}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      item.isShortlisted
                        ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                        : 'border-gray-300 text-gray-600 hover:bg-yellow-50'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${item.isShortlisted ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    {item.isShortlisted ? 'Shortlisted' : 'Shortlist'}
                  </button>
                  <span className="text-xs text-gray-400 capitalize ml-auto">Stage: {item.stage}</span>
                </div>

                <ExplainPanel applicationId={item.applicationId} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate Detection */}
      <Card className="p-5">
        <button
          onClick={() => setShowDuplicates(!showDuplicates)}
          className="flex items-center gap-2 w-full text-left"
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="font-semibold text-gray-900">Duplicate Candidates</span>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{duplicates.length}</span>
          {showDuplicates ? <ChevronUp className="w-4 h-4 ml-auto text-gray-400" /> : <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />}
        </button>

        {showDuplicates && (
          <div className="mt-4 space-y-2">
            {duplicates.length === 0 ? (
              <p className="text-sm text-gray-400">No duplicates detected.</p>
            ) : (
              duplicates.map((dup) => (
                <div key={dup._id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{dup.name}</p>
                    <p className="text-xs text-gray-500">{dup.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Duplicate of:</p>
                    <p className="text-xs font-medium text-gray-700">{dup.duplicateOf?.name}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
