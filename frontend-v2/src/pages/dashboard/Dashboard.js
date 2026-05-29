import { useEffect, useState } from 'react';
import { dashboardAPI } from '../../api/services';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress,
  Chip, Divider, Stack, Avatar,
} from '@mui/material';
import {
  Work, People, Description, CheckCircle, TrendingUp,
  BoltRounded, CalendarMonth, TrackChanges,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const STAGE_COLORS = {
  applied: '#6366f1', screening: '#f59e0b', interview: '#8b5cf6',
  technical: '#f97316', offer: '#3b82f6', hired: '#10b981', rejected: '#ef4444',
};

const STAT_CARDS = [
  { key: 'activeJobs', label: 'Active Jobs', icon: Work, color: '#1a1a2e', sub: (s) => `${s.totalJobs} total` },
  { key: 'totalCandidates', label: 'Candidates', icon: People, color: '#e94560', sub: () => null },
  { key: 'totalApplications', label: 'Applications', icon: Description, color: '#3b82f6', sub: (s) => `${s.shortlisted} shortlisted` },
  { key: 'hired', label: 'Hired', icon: CheckCircle, color: '#10b981', sub: () => null },
  { key: 'conversionRate', label: 'Conversion Rate', icon: TrackChanges, color: '#f59e0b', format: (v) => `${v}%`, sub: () => 'to hired' },
  { key: 'avgAiScore', label: 'Avg AI Score', icon: BoltRounded, color: '#8b5cf6', sub: (s) => `${s.totalScored} scored` },
  { key: 'upcomingInterviews', label: 'Upcoming Interviews', icon: CalendarMonth, color: '#0ea5e9', sub: () => null },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <CircularProgress sx={{ color: '#e94560' }} />
    </Box>
  );
  if (!data) return <Typography color="error">Failed to load dashboard.</Typography>;

  const { stats, stageDistribution, recentApplications, topJobs, monthlyTrend } = data;
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const trendData = monthlyTrend.map((m) => ({ month: monthNames[m._id.month - 1], count: m.count }));
  const pieData = stageDistribution.map((s) => ({ name: s._id, value: s.count }));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">Overview</Typography>
        <Typography variant="body2" color="text.secondary">Your recruitment pipeline at a glance</Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {STAT_CARDS.map(({ key, label, icon: Icon, color, format, sub }) => (
          <Grid item xs={6} sm={4} lg={3} key={key}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {label}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, letterSpacing: '-0.02em' }}>
                      {format ? format(stats[key]) : (stats[key] ?? '—')}
                    </Typography>
                    {sub && sub(stats) && (
                      <Typography variant="caption" color="text.secondary">{sub(stats)}</Typography>
                    )}
                  </Box>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon sx={{ fontSize: 22, color }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TrendingUp sx={{ color: '#e94560', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Application Trend</Typography>
              </Box>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendData} barSize={28}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e94560" />
                        <stop offset="100%" stopColor="#1a1a2e" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary" variant="body2">No data yet</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Pipeline Distribution</Typography>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={STAGE_COLORS[entry.name] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack spacing={0.8} mt={1}>
                    {pieData.map((entry, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STAGE_COLORS[entry.name] || '#94a3b8' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{entry.name}</Typography>
                        </Box>
                        <Typography variant="caption" fontWeight={600}>{entry.value}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </>
              ) : (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary" variant="body2">No data yet</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent + Top Jobs */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Recent Applications</Typography>
              {recentApplications.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No applications yet</Typography>
              ) : (
                <Stack divider={<Divider />}>
                  {recentApplications.map((app) => (
                    <Box key={app._id} sx={{ py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1a1a2e', fontSize: '0.75rem', fontWeight: 700 }}>
                          {app.candidate?.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{app.candidate?.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{app.job?.title}</Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={app.stage}
                        size="small"
                        sx={{
                          bgcolor: `${STAGE_COLORS[app.stage]}20`,
                          color: STAGE_COLORS[app.stage],
                          fontWeight: 600, fontSize: '0.7rem', textTransform: 'capitalize',
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Top Jobs by Applicants</Typography>
              {topJobs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No jobs yet</Typography>
              ) : (
                <Stack divider={<Divider />}>
                  {topJobs.map((job) => (
                    <Box key={job._id} sx={{ py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{job.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{job.department}</Typography>
                      </Box>
                      <Chip label={`${job.applicantsCount} applicants`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
