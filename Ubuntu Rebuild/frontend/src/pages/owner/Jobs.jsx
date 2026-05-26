import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Briefcase } from 'lucide-react';
import { toast } from 'react-toastify';

const OwnerJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Recruitment</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold">{job.title}</h3>
            <p className="text-gray-600">{job.department}</p>
            <p className="text-gray-600">{job.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnerJobs;
