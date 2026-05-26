import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { BsSearch, BsFilter, BsArrowDownUp, BsBriefcase, BsPerson, BsCalendar, BsStar, BsEnvelope, BsClipboardCheck } from 'react-icons/bs';

const AllApplicantsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchAllApplications();
    fetchJobs();
  }, []);

  const fetchAllApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs/applications/all');
      setApplications(res.data || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedApplications = useMemo(() => {
    let result = [...applications];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(app => 
        (app.applicantName?.toLowerCase().includes(term)) ||
        (app.applicantEmail?.toLowerCase().includes(term)) ||
        (app.phone?.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(app => app.status === statusFilter);
    }

    // Job filter
    if (jobFilter !== 'all') {
      result = result.filter(app => app.jobId === parseInt(jobFilter));
    }

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (sortField === 'applicantName') {
        valA = a.applicantName || '';
        valB = b.applicantName || '';
      }
      
      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';
      
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [applications, searchTerm, statusFilter, jobFilter, sortField, sortDirection]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-blue-100 text-blue-800',
      interview_scheduled: 'bg-purple-100 text-purple-800',
      interview_completed: 'bg-indigo-100 text-indigo-800',
      offer_sent: 'bg-green-100 text-green-800',
      hired: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <BsArrowDownUp className="text-gray-400" />;
    return sortDirection === 'asc' ?
      <BsArrowDownUp className="text-orange-500 rotate-180" /> :
      <BsArrowDownUp className="text-orange-500" />;
  };

  const handleShortlist = async (appId) => {
    try {
      await api.post(`/jobs/applications/${appId}/shortlist`);
      toast.success('Applicant shortlisted successfully');
      fetchAllApplications(); // Refresh the list
    } catch (err) {
      console.error('Failed to shortlist applicant:', err);
      toast.error(err.response?.data?.msg || 'Failed to shortlist applicant');
    }
  };

  const handleInterviewInvite = (app) => {
    // Create a simple modal or navigate to interview invite page
    const panelistEmail = prompt('Enter panelist email:');
    if (!panelistEmail) return;

    const customMetrics = [
      { name: 'Communication', maxScore: 10 },
      { name: 'Technical Knowledge', maxScore: 10 },
      { name: 'Problem Solving', maxScore: 10 },
      { name: 'Cultural Fit', maxScore: 10 }
    ];

    api.post(`/jobs/applications/${app.id}/interview-invite`, {
      interviewerEmails: [panelistEmail],
      customMetrics: customMetrics,
      interviewDate: new Date().toISOString()
    })
    .then(() => {
      toast.success('Interview invitation sent successfully');
      fetchAllApplications(); // Refresh the list
    })
    .catch(err => {
      console.error('Failed to send interview invite:', err);
      toast.error(err.response?.data?.msg || 'Failed to send interview invitation');
    });
  };

  const handleInputScores = (app) => {
    // Navigate to the detailed applicant page for score input
    window.location.href = `/recruitment/applicants/${app.id}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">All Applicants</h1>
            <p className="text-slate-600">View and manage all job applications across all positions</p>
          </div>
          <div className="text-sm text-slate-500">
            Total: <span className="font-semibold text-slate-900">{filteredAndSortedApplications.length}</span> applications
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px]">
              <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <BsFilter className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="interview_completed">Interview Completed</option>
                <option value="offer_sent">Offer Sent</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Job Filter */}
            <div className="flex items-center gap-2">
              <BsBriefcase className="text-slate-400" />
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Jobs</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading applications...</div>
          ) : filteredAndSortedApplications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <BsPerson className="mx-auto w-12 h-12 text-slate-300 mb-3" />
              <p>No applications found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('applicantName')}
                    >
                      <div className="flex items-center gap-2">
                        <BsPerson />
                        Applicant
                        <SortIcon field="applicantName" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('jobId')}
                    >
                      <div className="flex items-center gap-2">
                        <BsBriefcase />
                        Job
                        <SortIcon field="jobId" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Contact</th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('ai_ranking')}
                    >
                      <div className="flex items-center gap-2">
                        <BsStar />
                        Score
                        <SortIcon field="ai_ranking" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        <BsCalendar />
                        Applied
                        <SortIcon field="created_at" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAndSortedApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold">
                            {(app.applicantName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p 
                              className="font-medium text-slate-900 cursor-pointer hover:text-orange-600"
                              onClick={() => window.location.href = `/recruitment/applicants/${app.id}`}
                            >
                              {app.applicantName || 'N/A'}
                            </p>
                            <p className="text-xs text-slate-500">ID: {app.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-900">{app.jobTitle || `Job #${app.jobId}`}</p>
                        {app.jobDepartment && (
                          <p className="text-xs text-slate-500">{app.jobDepartment}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-600">{app.applicantEmail}</p>
                        {app.applicantPhone && (
                          <p className="text-xs text-slate-500">{app.applicantPhone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {(app.status || 'pending').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <BsStar className={app.ai_ranking > 70 ? 'text-yellow-400' : 'text-slate-300'} />
                          <span className="text-sm font-medium">
                            {app.ai_ranking ? Math.round(app.ai_ranking) : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* View Job Applicants Button */}
                          <button
                            onClick={() => window.location.href = `/recruitment/jobs/${app.jobId}/applicants`}
                            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                            title="View all applicants for this job"
                          >
                            <BsBriefcase className="inline mr-1" />
                            View Job
                          </button>
                          
                          {/* Shortlist Button */}
                          {app.status !== 'shortlisted' && app.status !== 'interview_scheduled' && app.status !== 'offer_sent' && app.status !== 'hired' && (
                            <button
                              onClick={() => handleShortlist(app.id)}
                              className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors"
                              title="Shortlist applicant"
                            >
                              <BsStar className="inline mr-1" />
                              Shortlist
                            </button>
                          )}
                          
                          {/* Interview Invite Button */}
                          {(app.status === 'shortlisted' || app.status === 'interview_scheduled') && (
                            <button
                              onClick={() => handleInterviewInvite(app)}
                              className="px-3 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded hover:bg-orange-100 transition-colors"
                              title="Send interview invitation"
                            >
                              <BsEnvelope className="inline mr-1" />
                              Interview
                            </button>
                          )}
                          
                          {/* Input Scores Button */}
                          {(app.status === 'interview_scheduled' || app.status === 'interview_completed') && (
                            <button
                              onClick={() => handleInputScores(app)}
                              className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
                              title="Input panelist scores"
                            >
                              <BsClipboardCheck className="inline mr-1" />
                              Scores
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AllApplicantsPage;
