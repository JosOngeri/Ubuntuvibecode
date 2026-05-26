import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Users, Calendar, DollarSign, FileText, Briefcase, Activity } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    totalPayroll: 0,
    openJobs: 0,
    activeComplaints: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, attRes, leaveRes, payrollRes, jobsRes, compRes] = await Promise.all([
          api.get('/employees'),
          api.get('/attendance'),
          api.get('/leaves'),
          api.get('/payroll'),
          api.get('/jobs'),
          api.get('/complaints'),
        ]);
        setStats({
          totalEmployees: empRes.data.length || 0,
          presentToday: attRes.data.filter(a => a.status === 'Present').length || 0,
          pendingLeaves: leaveRes.data.filter(l => l.status === 'pending').length || 0,
          totalPayroll: payrollRes.data.reduce((sum, p) => sum + (p.netPay || 0), 0) || 0,
          openJobs: jobsRes.data.filter(j => j.status === 'open').length || 0,
          activeComplaints: compRes.data.filter(c => c.status !== 'resolved').length || 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'bg-blue-500' },
    { label: 'Present Today', value: stats.presentToday, icon: Calendar, color: 'bg-green-500' },
    { label: 'Pending Leaves', value: stats.pendingLeaves, icon: FileText, color: 'bg-yellow-500' },
    { label: 'Total Payroll (KES)', value: stats.totalPayroll.toLocaleString(), icon: DollarSign, color: 'bg-purple-500' },
    { label: 'Open Jobs', value: stats.openJobs, icon: Briefcase, color: 'bg-orange-500' },
    { label: 'Active Complaints', value: stats.activeComplaints, icon: Activity, color: 'bg-red-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

export default AdminDashboard;
