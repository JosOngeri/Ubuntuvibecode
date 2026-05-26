import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Wrench, Search, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchAssets();
  }, [typeFilter]);

  const fetchAssets = async () => {
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/assets', { params });
      setAssets(res.data);
    } catch (err) {
      toast.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Assets</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md mb-6 p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All</option>
              <option value="Equipment">Equipment</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Furniture">Furniture</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{asset.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{asset.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{asset.assignedToName || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {asset.assignedDate ? new Date(asset.assignedDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      asset.condition === 'good' ? 'bg-green-100 text-green-800' :
                      asset.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {asset.condition}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {assets.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No assets found
          </div>
        )}
      </div>
    </div>
  );
};

export default Assets;
