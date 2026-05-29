import { useEffect, useState } from 'react';
import { jobsAPI } from '../../api/services';
import { Button, Card, Badge, Modal, Input, Select, Textarea, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';
import { Plus, Search, MapPin, Clock, DollarSign, Users, Edit2, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const statusColor = { active: 'green', draft: 'gray', paused: 'yellow', closed: 'red' };
const typeColor = { 'full-time': 'blue', 'part-time': 'purple', contract: 'orange', remote: 'indigo', hybrid: 'green' };

const EMPTY_FORM = { title: '', department: '', location: '', type: 'full-time', experience: '', description: '', requirements: '', skills: '', status: 'active', 'salary.min': '', 'salary.max': '' };

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewJob, setViewJob] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.getAll({ search, status: statusFilter, page, limit: 9 });
      setJobs(res.data.jobs);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [search, statusFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setEditJob(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (job) => {
    setEditJob(job);
    setForm({
      title: job.title, department: job.department, location: job.location,
      type: job.type, experience: job.experience, description: job.description,
      requirements: job.requirements?.join('\n') || '',
      skills: job.skills?.join(', ') || '',
      status: job.status,
      'salary.min': job.salary?.min || '',
      'salary.max': job.salary?.max || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        requirements: form.requirements.split('\n').filter(Boolean),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        salary: { min: Number(form['salary.min']) || 0, max: Number(form['salary.max']) || 0 },
      };
      delete payload['salary.min']; delete payload['salary.max'];

      if (editJob) {
        await jobsAPI.update(editJob._id, payload);
        toast.success('Job updated');
      } else {
        await jobsAPI.create(payload);
        toast.success('Job created');
      }
      setModalOpen(false);
      fetchJobs();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    try { await jobsAPI.delete(id); toast.success('Job deleted'); fetchJobs(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        {['admin', 'recruiter'].includes(user?.role) && (
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Post Job</Button>
        )}
      </div>

      <p className="text-sm text-gray-500">{total} job{total !== 1 ? 's' : ''} found</p>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-400">No jobs found. Create your first job posting!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Card key={job._id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                  <p className="text-sm text-gray-500">{job.department}</p>
                </div>
                <Badge color={statusColor[job.status]}>{job.status}</Badge>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />{job.location}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />{job.experience}
                </div>
                {(job.salary?.min || job.salary?.max) && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <DollarSign className="w-3 h-3" />
                    {job.salary.min && job.salary.max ? `${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}` : job.salary.min || job.salary.max}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users className="w-3 h-3" />{job.applicantsCount} applicants
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                <Badge color={typeColor[job.type]}>{job.type}</Badge>
                {job.skills?.slice(0, 3).map((s) => <Badge key={s} color="gray">{s}</Badge>)}
                {job.skills?.length > 3 && <Badge color="gray">+{job.skills.length - 3}</Badge>}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => setViewJob(job)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600">
                  <Eye className="w-3.5 h-3.5" />View
                </button>
                {['admin', 'recruiter'].includes(user?.role) && (
                  <button onClick={() => openEdit(job)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 ml-2">
                    <Edit2 className="w-3.5 h-3.5" />Edit
                  </button>
                )}
                {user?.role === 'admin' && (
                  <button onClick={() => handleDelete(job._id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 ml-2">
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </button>
                )}
                <span className="ml-auto text-xs text-gray-400">{format(new Date(job.createdAt), 'MMM d')}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 9 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page}</span>
          <Button variant="secondary" size="sm" disabled={jobs.length < 9} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editJob ? 'Edit Job' : 'Post New Job'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Job Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            <Input label="Experience Required" placeholder="e.g. 3-5 years" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Job Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </Select>
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Salary (USD)" type="number" placeholder="50000" value={form['salary.min']} onChange={(e) => setForm({ ...form, 'salary.min': e.target.value })} />
            <Input label="Max Salary (USD)" type="number" placeholder="80000" value={form['salary.max']} onChange={(e) => setForm({ ...form, 'salary.max': e.target.value })} />
          </div>
          <Textarea label="Job Description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Textarea label="Requirements (one per line)" rows={3} placeholder="Bachelor's degree in CS&#10;3+ years React experience" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
          <Input label="Skills (comma-separated)" placeholder="React, Node.js, MongoDB" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editJob ? 'Update Job' : 'Post Job'}</Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewJob} onClose={() => setViewJob(null)} title={viewJob?.title} size="lg">
        {viewJob && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge color={statusColor[viewJob.status]}>{viewJob.status}</Badge>
              <Badge color={typeColor[viewJob.type]}>{viewJob.type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Department:</span> <span className="font-medium">{viewJob.department}</span></div>
              <div><span className="text-gray-500">Location:</span> <span className="font-medium">{viewJob.location}</span></div>
              <div><span className="text-gray-500">Experience:</span> <span className="font-medium">{viewJob.experience}</span></div>
              <div><span className="text-gray-500">Applicants:</span> <span className="font-medium">{viewJob.applicantsCount}</span></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{viewJob.description}</p>
            </div>
            {viewJob.requirements?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Requirements</p>
                <ul className="list-disc list-inside space-y-1">
                  {viewJob.requirements.map((r, i) => <li key={i} className="text-sm text-gray-600">{r}</li>)}
                </ul>
              </div>
            )}
            {viewJob.skills?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1">{viewJob.skills.map((s) => <Badge key={s} color="indigo">{s}</Badge>)}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
