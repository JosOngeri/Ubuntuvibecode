import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { ClipboardList, Check } from 'lucide-react';
import { toast } from 'react-toastify';

const ContractorMilestones = () => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      const res = await api.get('/contractors/milestones');
      setMilestones(res.data);
    } catch (err) {
      toast.error('Failed to fetch milestones');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/contractors/milestones/${id}`, { status: 'completed' });
      toast.success('Milestone marked as completed');
      fetchMilestones();
    } catch (err) {
      toast.error('Failed to update milestone');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Milestones</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">{milestone.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs ${
                milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {milestone.status}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Description:</strong> {milestone.description}</p>
              <p><strong>Budget:</strong> KES {milestone.budget?.toLocaleString() || 0}</p>
              <p><strong>Deadline:</strong> {new Date(milestone.deadline).toLocaleDateString()}</p>
            </div>
            {milestone.status !== 'completed' && (
              <button
                onClick={() => handleComplete(milestone.id)}
                className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Mark Complete
              </button>
            )}
          </div>
        ))}
      </div>

      {milestones.length === 0 && (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-md">
          No milestones found
        </div>
      )}
    </div>
  );
};

export default ContractorMilestones;
