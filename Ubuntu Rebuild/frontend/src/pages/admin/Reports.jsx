import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Activity, Download, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [data, setData] = useState({
    attendanceByMonth: [],
    payrollByMonth: [],
    leaveByType: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const [attRes, payrollRes, leaveRes] = await Promise.all([
        api.get('/attendance'),
        api.get('/payroll'),
        api.get('/leaves'),
      ]);
      
      setData({
        attendanceByMonth: attRes.data,
        payrollByMonth: payrollRes.data,
        leaveByType: leaveRes.data,
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
            <BarChart data={data.attendanceByMonth.slice(0, 7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attendanceDate" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalHoursWorked" fill="#3b82f6" name="Hours Worked" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Payroll Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.payrollByMonth.slice(0, 7)}>
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

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Leave by Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Annual', 'Sick', 'Maternity', 'Paternity', 'Off-day', 'Compassionate', 'Study'].map((type) => {
            const count = data.leaveByType.filter(l => l.leaveType === type).length;
            return (
              <div key={type} className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">{type}</p>
                <p className="text-2xl font-bold text-gray-800">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Quick Reports</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Calendar size={24} className="text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-800">Monthly Attendance</p>
              <p className="text-sm text-gray-500">Download report</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <DollarSign size={24} className="text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-800">Payroll Summary</p>
              <p className="text-sm text-gray-500">Download report</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Activity size={24} className="text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-gray-800">KPI Summary</p>
              <p className="text-sm text-gray-500">Download report</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
