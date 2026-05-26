import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { Calendar, DollarSign, FileText, GraduationCap, User } from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    attendanceThisMonth: 0,
    pendingLeaves: 0,
    lastPayroll: 0,
    kpiScore: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [attRes, leaveRes, payrollRes, kpiRes] = await Promise.all([
          api.get('/attendance'),
          api.get('/leaves'),
          api.get('/payroll'),
          api.get('/kpi'),
        ]);
        setStats({
          attendanceThisMonth: attRes.data.filter(a => a.status === 'Present').length || 0,
          pendingLeaves: leaveRes.data.filter(l => l.status === 'pending').length || 0,
          lastPayroll: payrollRes.data[0]?.netPay || 0,
          kpiScore: kpiRes.data[0]?.score || 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Days Present This Month', value: stats.attendanceThisMonth, icon: Calendar, color: 'bg-green-500' },
    { label: 'Pending Leave Requests', value: stats.pendingLeaves, icon: FileText, color: 'bg-yellow-500' },
    { label: 'Last Payroll (KES)', value: stats.lastPayroll.toLocaleString(), icon: DollarSign, color: 'bg-purple-500' },
    { label: 'Latest KPI Score', value: `${stats.kpiScore}%`, icon: GraduationCap, color: 'bg-blue-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user?.username || 'Employee'}</h1>
      <p className="text-gray-600 mb-6">Here's your overview</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-full`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
