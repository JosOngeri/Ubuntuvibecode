import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Briefcase, Search, Plus, Users } from 'lucide-react';
import { toast } from 'react-toastify';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/jobs', { params });
      setJobs(res.data);
    } catch (err) {
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Job Openings</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} />
          Post Job
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md mb-6 p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs ${
                job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {job.status}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Department:</strong> {job.department}</p>
              <p><strong>Type:</strong> {job.employmentType}</p>
              <p><strong>Salary:</strong> {job.salaryRange}</p>
              <p><strong>Positions:</strong> {job.numberOfPositions}</p>
              <p><strong>Closing:</strong> {job.applicationClosingDate ? new Date(job.applicationClosingDate).toLocaleDateString() : 'Open'}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                View Applications
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-md">
          No job openings found
        </div>
      )}
    </div>
  );
};

export default Jobs;
