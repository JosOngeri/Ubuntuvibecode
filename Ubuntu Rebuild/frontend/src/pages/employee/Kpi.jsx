import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { GraduationCap, Target, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';

const EmployeeKpi = () => {
  const { user } = useAuth();
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
      toast.error('Failed to fetch KPI data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My KPI</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Target className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-800">
                {kpi.length ? Math.round(kpi.reduce((s, k) => s + (k.score || 0), 0) / kpi.length) : 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-800">
                {kpi.filter(k => k.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <GraduationCap className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-800">
                {kpi.filter(k => k.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KPI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Achieved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kpi.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{record.definitionTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{record.period}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{record.targetValue}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{record.achievedValue || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{record.score || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    KES {record.kpiBonus?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.status === 'completed' ? 'bg-green-100 text-green-800' :
                      record.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {kpi.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No KPI records found
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeKpi;
