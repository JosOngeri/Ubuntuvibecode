import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  MessageSquare,
  CheckSquare,
  FileText,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { FullPageLoading } from '../../components/common/Loading';
import { API_ENDPOINTS } from '../../constants/api';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const DepartmentDashboard = () => {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [communications, setCommunications] = useState([]);
  const [members, setMembers] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [commForm, setCommForm] = useState({
    title: '',
    message: '',
    type: 'Announcement',
    priority: 'normal',
  });
  const [meetForm, setMeetForm] = useState({
    title: '',
    description: '',
    meetingDate: '',
    duration: 60,
    location: '',
  });

  const fetchDepartmentDashboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.DEPARTMENT.DASHBOARD}/${departmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch department dashboard');
      const data = await response.json();
      setDashboard(data.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    setLoading(true);
    fetchDepartmentDashboard();
  }, [departmentId, fetchDepartmentDashboard]);

  const loadCommunications = useCallback(async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.DEPARTMENT.COMMUNICATIONS}?department_id=${departmentId}&limit=50`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load communications');
      setCommunications(json.data || []);
    } catch (e) {
      toast.error(e.message);
      setCommunications([]);
    } finally {
      setTabLoading(false);
    }
  }, [departmentId]);

  const loadMembers = useCallback(async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.DEPARTMENT.MEMBERS}?department_id=${departmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load members');
      setMembers(json.data || []);
    } catch (e) {
      toast.error(e.message);
      setMembers([]);
    } finally {
      setTabLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    if (!departmentId) return;
    if (activeTab === 'communications') loadCommunications();
    else if (activeTab === 'members') loadMembers();
  }, [activeTab, departmentId, loadCommunications, loadMembers]);

  const submitCommunication = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_ENDPOINTS.DEPARTMENT.COMMUNICATIONS}?department_id=${departmentId}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: commForm.title,
          message: commForm.message,
          type: commForm.type,
          priority: commForm.priority,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.details || 'Failed to post');
      toast.success('Communication posted');
      setShowCommModal(false);
      setCommForm({ title: '', message: '', type: 'Announcement', priority: 'normal' });
      loadCommunications();
      fetchDepartmentDashboard();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitMeeting = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_ENDPOINTS.DEPARTMENT.MEETINGS}?department_id=${departmentId}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: meetForm.title,
          description: meetForm.description,
          meetingDate: meetForm.meetingDate,
          duration: Number(meetForm.duration) || 60,
          location: meetForm.location,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.details || 'Failed to schedule meeting');
      toast.success('Meeting scheduled');
      setShowMeetModal(false);
      setMeetForm({ title: '', description: '', meetingDate: '', duration: 60, location: '' });
      fetchDepartmentDashboard();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'normal':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'communication':
        return <MessageSquare className="w-4 h-4" />;
      case 'meeting':
        return <Calendar className="w-4 h-4" />;
      case 'task':
        return <CheckSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <FullPageLoading message="Loading department dashboard..." />
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load department dashboard</p>
      </div>
    );
  }

  const { department, metrics, recentActivities, upcomingMeetings, pendingTasks } = dashboard;

  const modalBackdrop = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/departments')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{department.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {department.category} • Role: {department.userRole}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('communications');
              setShowCommModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            New Communication
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('meetings');
              setShowMeetModal(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Schedule Meeting
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex flex-wrap gap-4">
          {['overview', 'communications', 'meetings', 'tasks', 'members'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.total_members || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Communications (30d)</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.communications_this_month || 0}
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Meetings (30d)</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.meetings_this_month || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.pending_tasks || 0}</p>
                </div>
                <CheckSquare className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h2>
              </div>
              <div className="p-6 space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                        <p className="text-sm text-gray-500">by {activity.author}</p>
                        <p className="text-xs text-gray-400">
                          {activity.date ? new Date(activity.date).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent activities</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Meetings</h2>
              </div>
              <div className="p-6 space-y-4">
                {upcomingMeetings.length > 0 ? (
                  upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="border-l-4 border-blue-500 pl-4">
                      <p className="font-medium text-gray-900 dark:text-white">{meeting.title}</p>
                      <p className="text-sm text-gray-500">{meeting.location}</p>
                      <p className="text-xs text-gray-400">
                        {meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleString() : ''}
                        {meeting.duration != null ? ` • ${meeting.duration} min` : ''}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No upcoming meetings</p>
                )}
              </div>
            </div>
          </div>

          {pendingTasks.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Tasks</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                        <p className="text-sm text-gray-500">Assigned to: {task.assigned_to_name}</p>
                        <p className="text-xs text-gray-400">
                          Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'communications' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Communications</h2>
            <button
              type="button"
              onClick={() => setShowCommModal(true)}
              className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              New
            </button>
          </div>
          {tabLoading ? (
            <p className="text-gray-500 text-center py-8">Loading…</p>
          ) : communications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No communications yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {communications.map((c) => (
                <li key={c.id} className="py-4">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">{c.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${getPriorityColor(c.priority)}`}>
                      {c.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">{c.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {c.sender_name || 'Unknown'} · {c.sent_at ? new Date(c.sent_at).toLocaleString() : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'meetings' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming meetings</h2>
            <button
              type="button"
              onClick={() => setShowMeetModal(true)}
              className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Schedule
            </button>
          </div>
          {upcomingMeetings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming meetings scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingMeetings.map((m) => (
                <li key={m.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <p className="font-medium text-gray-900 dark:text-white">{m.title}</p>
                  <p className="text-sm text-gray-500">{m.location}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {m.meeting_date ? new Date(m.meeting_date).toLocaleString() : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending tasks</h2>
          {pendingTasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending tasks.</p>
          ) : (
            <ul className="space-y-3">
              {pendingTasks.map((task) => (
                <li key={task.id} className="flex justify-between gap-4 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                    <p className="text-sm text-gray-500">To: {task.assigned_to_name}</p>
                    <p className="text-xs text-gray-400">
                      Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full h-fit ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Members</h2>
          {tabLoading ? (
            <p className="text-gray-500 text-center py-8">Loading…</p>
          ) : members.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No members listed.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-600">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Role</th>
                  <th className="pb-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 pr-4 text-gray-900 dark:text-white">
                      {m.first_name} {m.last_name}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{m.email}</td>
                    <td className="py-2 pr-4 text-gray-600">{m.role}</td>
                    <td className="py-2 text-gray-500">
                      {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCommModal && (
        <div className={modalBackdrop}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              type="button"
              className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowCommModal(false)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New communication</h3>
            <form onSubmit={submitCommunication} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  required
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  value={commForm.title}
                  onChange={(e) => setCommForm({ ...commForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  value={commForm.message}
                  onChange={(e) => setCommForm({ ...commForm, message: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    value={commForm.type}
                    onChange={(e) => setCommForm({ ...commForm, type: e.target.value })}
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Report">Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    value={commForm.priority}
                    onChange={(e) => setCommForm({ ...commForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
                  onClick={() => setShowCommModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMeetModal && (
        <div className={modalBackdrop}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              type="button"
              className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowMeetModal(false)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Schedule meeting</h3>
            <form onSubmit={submitMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  required
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  value={meetForm.title}
                  onChange={(e) => setMeetForm({ ...meetForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  value={meetForm.description}
                  onChange={(e) => setMeetForm({ ...meetForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date &amp; time
                </label>
                <input
                  required
                  type="datetime-local"
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  value={meetForm.meetingDate}
                  onChange={(e) => setMeetForm({ ...meetForm, meetingDate: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    value={meetForm.duration}
                    onChange={(e) => setMeetForm({ ...meetForm, duration: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    value={meetForm.location}
                    onChange={(e) => setMeetForm({ ...meetForm, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
                  onClick={() => setShowMeetModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDashboard;
