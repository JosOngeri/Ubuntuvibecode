import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Activity, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const OwnerReports = () => {
  const [data, setData] = useState({
    attendance: [],
    payroll: [],
    leaves: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attRes, payrollRes, leaveRes] = await Promise.all([
        api.get('/attendance'),
        api.get('/payroll'),
        api.get('/leaves'),
      ]);
      setData({
        attendance: attRes.data,
        payroll: payrollRes.data,
        leaves: leaveRes.data,
      });
    } catch (err) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          <Download size={18} />
          Export All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Attendance Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.attendance.slice(0, 7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attendanceDate" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalHoursWorked" fill="#3b82f6" name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Payroll Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.payroll.slice(0, 7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="netPay" fill="#10b981" name="Net Pay (KES)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Activity size={24} className="text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-800">Attendance Report</p>
              <p className="text-sm text-gray-500">Download</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <DollarSign size={24} className="text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-800">Payroll Report</p>
              <p className="text-sm text-gray-500">Download</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <BarChart3 size={24} className="text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-gray-800">KPI Report</p>
              <p className="text-sm text-gray-500">Download</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerReports;
