import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { ClipboardList, Check } from 'lucide-react';
import { toast } from 'react-toastify';

const EmployeeOrientation = () => {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecklist();
  }, []);

  const fetchChecklist = async () => {
    try {
      const res = await api.get('/orientation');
      setChecklist(res.data[0] || null);
    } catch (err) {
      toast.error('Failed to fetch orientation checklist');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const items = checklist && typeof checklist.items === 'string' ? JSON.parse(checklist.items) : checklist?.items || [];
  const completedCount = items?.filter(i => i.completed).length || 0;
  const totalCount = items?.length || 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Orientation</h1>

      {!checklist ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          No orientation checklist assigned
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Progress</h2>
              <span className="text-sm text-gray-600">{completedCount}/{totalCount} items</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{progress}% complete</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Checklist Items</h2>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                    item.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {item.completed && <Check className="text-white" size={16} />}
                  </div>
                  <span className={item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>
                    {item.item}
                  </span>
                </div>
              ))}
            </div>
            {checklist.completedAt && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Completed on: {new Date(checklist.completedAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Completed by: {checklist.completedByName || '-'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeOrientation;
