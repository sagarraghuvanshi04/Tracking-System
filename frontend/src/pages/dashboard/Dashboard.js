import { useEffect, useState } from 'react';
import { dashboardAPI } from '../../api/services';
import { Card, Spinner, StageBadge } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Briefcase, Users, FileText, Calendar, TrendingUp, Star, UserCheck, Target, Zap } from 'lucide-react';


const STAGE_COLORS = {
  applied: '#6366f1', screening: '#f59e0b', interview: '#8b5cf6',
  technical: '#f97316', offer: '#3b82f6', hired: '#10b981', rejected: '#ef4444',
};

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <Card className="p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </Card>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (!data) return <p className="text-gray-500">Failed to load dashboard data.</p>;

  const { stats, stageDistribution, recentApplications, topJobs, monthlyTrend } = data;

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const trendData = monthlyTrend.map((m) => ({ month: monthNames[m._id.month - 1], count: m.count }));
  const pieData = stageDistribution.map((s) => ({ name: s._id, value: s.count }));

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Active Jobs" value={stats.activeJobs} sub={`${stats.totalJobs} total`} color="bg-indigo-500" />
        <StatCard icon={Users} label="Candidates" value={stats.totalCandidates} color="bg-purple-500" />
        <StatCard icon={FileText} label="Applications" value={stats.totalApplications} sub={`${stats.shortlisted} shortlisted`} color="bg-blue-500" />
        <StatCard icon={UserCheck} label="Hired" value={stats.hired} color="bg-emerald-500" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Target} label="Conversion Rate" value={`${stats.conversionRate}%`} sub="Applications to hired" color="bg-orange-500" />
        <StatCard icon={Zap} label="Avg AI Score" value={stats.avgAiScore || '—'} sub={`${stats.totalScored} scored`} color="bg-violet-500" />
        <StatCard icon={Calendar} label="Upcoming Interviews" value={stats.upcomingInterviews} color="bg-teal-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Application Trend</h3>
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </Card>

        {/* Pipeline Distribution */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Pipeline</h3>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={STAGE_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {pieData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[entry.name] || '#94a3b8' }} />
                      <span className="text-gray-600 capitalize">{entry.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Applications</h3>
          {recentApplications.length === 0 ? (
            <p className="text-sm text-gray-400">No applications yet</p>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <div key={app._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.candidate?.name}</p>
                    <p className="text-xs text-gray-500">{app.job?.title} · {app.job?.department}</p>
                  </div>
                  <StageBadge stage={app.stage} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Jobs */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Jobs by Applicants</h3>
          {topJobs.length === 0 ? (
            <p className="text-sm text-gray-400">No jobs yet</p>
          ) : (
            <div className="space-y-3">
              {topJobs.map((job) => (
                <div key={job._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.department}</p>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">{job.applicantsCount} applicants</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>


    </div>
  );
}
