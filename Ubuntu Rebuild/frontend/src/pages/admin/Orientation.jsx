import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { ClipboardList, Search, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

const Orientation = () => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      const res = await api.get('/orientation');
      setChecklists(res.data);
    } catch (err) {
      toast.error('Failed to fetch orientation checklists');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Orientation Checklists</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} />
          Create Checklist
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {checklists.map((checklist) => {
          const items = typeof checklist.items === 'string' ? JSON.parse(checklist.items) : checklist.items;
          const completedCount = items?.filter(i => i.completed).length || 0;
          const totalCount = items?.length || 0;
          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div key={checklist.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {checklist.employeeName || 'Unknown Employee'}
                </h3>
                <span className="text-sm text-gray-500">
                  {completedCount}/{totalCount} items
                </span>
              </div>
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{progress}% complete</p>
              </div>
              <div className="space-y-2">
                {items?.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className={`w-4 h-4 rounded ${
                      item.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`}></span>
                    <span className={item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>
                      {item.item}
                    </span>
                  </div>
                ))}
                {items?.length > 3 && (
                  <p className="text-sm text-gray-500">+{items.length - 3} more items</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Completed by: {checklist.completedByName || '-'}
                </p>
                <p className="text-sm text-gray-500">
                  Date: {checklist.completedAt ? new Date(checklist.completedAt).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {checklists.length === 0 && (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-md">
          No orientation checklists found
        </div>
      )}
    </div>
  );
};

export default Orientation;
