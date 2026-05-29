import { useEffect, useState } from 'react';
import { interviewsAPI, applicationsAPI } from '../../api/services';
import { Button, Card, Badge, Modal, Input, Select, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';
import { Plus, Calendar, Clock, Video, Phone, Monitor, MapPin, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const typeIcon = { video: Video, phone: Phone, technical: Monitor, onsite: MapPin };
const typeColor = { video: 'blue', phone: 'green', technical: 'purple', onsite: 'orange' };
const statusColor = { scheduled: 'blue', completed: 'green', cancelled: 'red', rescheduled: 'yellow' };

const EMPTY_FORM = { applicationId: '', scheduledAt: '', type: 'video', duration: 60, meetingLink: '', notes: '' };

export default function Interviews() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editInterview, setEditInterview] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [applications, setApplications] = useState([]);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const params = {};
      if (upcomingOnly) params.upcoming = true;
      const res = await interviewsAPI.getAll(params);
      setInterviews(res.data);
    } catch { toast.error('Failed to load interviews'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInterviews(); }, [upcomingOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = async () => {
    setEditInterview(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
    try {
      const res = await applicationsAPI.getAll({ limit: 200 });
      // Only show applications that have both candidate and job populated
      const active = res.data.applications.filter(
        (a) => a.stage !== 'rejected' && a.stage !== 'hired' && a.job && a.candidate
      );
      setApplications(active);
    } catch { toast.error('Failed to load applications'); }
  };

  const openEdit = (interview) => {
    setEditInterview(interview);
    setForm({
      applicationId: interview.application,
      scheduledAt: format(new Date(interview.scheduledAt), "yyyy-MM-dd'T'HH:mm"),
      type: interview.type,
      duration: interview.duration,
      meetingLink: interview.meetingLink || '',
      notes: interview.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editInterview) {
        await interviewsAPI.update(editInterview._id, form);
        toast.success('Interview updated');
      } else {
        await interviewsAPI.schedule(form);
        toast.success('Interview scheduled & invite sent!');
      }
      setModalOpen(false);
      fetchInterviews();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this interview?')) return;
    try { await interviewsAPI.delete(id); toast.success('Deleted'); fetchInterviews(); }
    catch { toast.error('Delete failed'); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await interviewsAPI.update(id, { status });
      toast.success('Status updated');
      fetchInterviews();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setUpcomingOnly(!upcomingOnly)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${upcomingOnly ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
        >
          <Calendar className="w-4 h-4" />Upcoming Only
        </button>
        {['admin', 'recruiter'].includes(user?.role) && (
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Schedule Interview</Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : interviews.length === 0 ? (
        <Card className="p-12 text-center"><p className="text-gray-400">No interviews scheduled yet.</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {interviews.map((interview) => {
            const TypeIcon = typeIcon[interview.type] || Video;
            return (
              <Card key={interview._id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{interview.candidate?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{interview.job?.title}</p>
                  </div>
                  <Badge color={statusColor[interview.status]}>{interview.status}</Badge>
                </div>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(interview.scheduledAt), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    {format(new Date(interview.scheduledAt), 'h:mm a')} · {interview.duration} min
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <TypeIcon className="w-3 h-3" />
                    <Badge color={typeColor[interview.type]}>{interview.type}</Badge>
                  </div>
                  {interview.meetingLink && (
                    <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline truncate block">
                      Join Meeting
                    </a>
                  )}
                </div>
                {interview.interviewers?.length > 0 && (
                  <div className="flex items-center gap-1 mb-3">
                    {interview.interviewers.map((iv) => (
                      <span key={iv._id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{iv.name}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  {interview.status === 'scheduled' && (
                    <button onClick={() => handleStatusUpdate(interview._id, 'completed')} className="text-xs text-emerald-600 hover:underline">Mark Done</button>
                  )}
                  {['admin', 'recruiter'].includes(user?.role) && (
                    <>
                      <button onClick={() => openEdit(interview)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 ml-auto">
                        <Edit2 className="w-3.5 h-3.5" />Edit
                      </button>
                      <button onClick={() => handleDelete(interview._id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editInterview ? 'Edit Interview' : 'Schedule Interview'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          {!editInterview && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Application</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                value={form.applicationId}
                onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
                required
              >
                <option value="">Select application...</option>
                {applications.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.candidate?.name} — {a.job?.title} ({a.stage})
                  </option>
                ))}
              </select>
              {applications.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
                  ⚠️ No eligible applications found. To schedule an interview, first go to
                  <strong> Candidates</strong> → click <strong>Apply</strong> on a candidate → select an active job.
                  Then come back here.
                </p>
              )}
            </div>
          )}
          <Input
            label="Date & Time"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Interview Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="video">Video</option>
              <option value="phone">Phone</option>
              <option value="technical">Technical</option>
              <option value="onsite">Onsite</option>
            </Select>
            <Input label="Duration (minutes)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </div>
          <Input label="Meeting Link (optional)" placeholder="https://meet.google.com/..." value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editInterview ? 'Update' : 'Schedule'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
