import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { ClipboardList } from 'lucide-react';
import { toast } from 'react-toastify';

const OwnerOrientation = () => {
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
      toast.error('Failed to fetch orientation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Orientation</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {checklists.map((c) => {
          const items = typeof c.items === 'string' ? JSON.parse(c.items) : c.items;
          const completed = items?.filter(i => i.completed).length || 0;
          const total = items?.length || 0;
          return (
            <div key={c.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold">{c.employeeName || 'Unknown'}</h3>
              <p className="text-gray-600">{completed}/{total} items</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OwnerOrientation;
