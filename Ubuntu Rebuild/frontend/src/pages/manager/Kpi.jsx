import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { BarChart3 } from 'lucide-react';
import { toast } from 'react-toastify';

const ManagerKpi = () => {
  const [kpi, setKpi] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKpi();
  }, []);

  const fetchKpi = async () => {
    try {
      const res = await api.get('/kpi');
      setKpi(res.data);
    } catch (err) {
      toast.error('Failed to fetch KPI');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Team KPI</h1>
      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KPI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kpi.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{record.employeeName || '-'}</td>
                  <td className="px-6 py-4">{record.definitionTitle}</td>
                  <td className="px-6 py-4">{record.score || '-'}</td>
                  <td className="px-6 py-4">{record.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerKpi;
