import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { Users, Calendar, DollarSign, BarChart3, Briefcase, Building, Activity, Database } from 'lucide-react';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    totalPayroll: 0,
    avgKpi: 0,
    openJobs: 0,
    activeContractors: 0,
    activeComplaints: 0,
    systemHealth: 'ok',
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, attRes, payrollRes, kpiRes, jobsRes, contRes, compRes, healthRes] = await Promise.all([
          api.get('/employees'),
          api.get('/attendance'),
          api.get('/payroll'),
          api.get('/kpi'),
          api.get('/jobs'),
          api.get('/contractors'),
          api.get('/complaints'),
          api.get('/health/full'),
        ]);
        setStats({
          totalEmployees: empRes.data.length || 0,
          presentToday: attRes.data.filter(a => a.status === 'Present').length || 0,
          totalPayroll: payrollRes.data.reduce((sum, p) => sum + (p.netPay || 0), 0) || 0,
          avgKpi: kpiRes.data.length ? Math.round(kpiRes.data.reduce((s, k) => s + (k.score || 0), 0) / kpiRes.data.length) : 0,
          openJobs: jobsRes.data.filter(j => j.status === 'open').length || 0,
          activeContractors: contRes.data.filter(c => c.status === 'active').length || 0,
          activeComplaints: compRes.data.filter(c => c.status !== 'resolved').length || 0,
          systemHealth: healthRes.data.status || 'ok',
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
    { label: 'Total Payroll (KES)', value: stats.totalPayroll.toLocaleString(), icon: DollarSign, color: 'bg-purple-500' },
    { label: 'Average KPI', value: `${stats.avgKpi}%`, icon: BarChart3, color: 'bg-yellow-500' },
    { label: 'Open Jobs', value: stats.openJobs, icon: Briefcase, color: 'bg-orange-500' },
    { label: 'Active Contractors', value: stats.activeContractors, icon: Building, color: 'bg-teal-500' },
    { label: 'Active Complaints', value: stats.activeComplaints, icon: Activity, color: 'bg-red-500' },
    { label: 'System Health', value: stats.systemHealth.toUpperCase(), icon: Database, color: stats.systemHealth === 'ok' ? 'bg-green-500' : 'bg-red-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user?.username || 'Owner'}</h1>
      <p className="text-gray-600 mb-6">Business Overview</p>
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

export default OwnerDashboard;
