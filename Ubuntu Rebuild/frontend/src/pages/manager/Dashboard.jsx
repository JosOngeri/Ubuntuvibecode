import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { Users, Calendar, FileText, BarChart3, Briefcase, MessageSquare } from 'lucide-react';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    teamSize: 0,
    presentToday: 0,
    pendingApprovals: 0,
    teamKpiAvg: 0,
    openJobs: 0,
    activeComplaints: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, attRes, leaveRes, kpiRes, jobsRes, compRes] = await Promise.all([
          api.get('/employees'),
          api.get('/attendance'),
          api.get('/leaves'),
          api.get('/kpi'),
          api.get('/jobs'),
          api.get('/complaints'),
        ]);
        setStats({
          teamSize: empRes.data.length || 0,
          presentToday: attRes.data.filter(a => a.status === 'Present').length || 0,
          pendingApprovals: leaveRes.data.filter(l => l.status === 'pending').length || 0,
          teamKpiAvg: kpiRes.data.length ? Math.round(kpiRes.data.reduce((s, k) => s + (k.score || 0), 0) / kpiRes.data.length) : 0,
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
    { label: 'Team Size', value: stats.teamSize, icon: Users, color: 'bg-blue-500' },
    { label: 'Present Today', value: stats.presentToday, icon: Calendar, color: 'bg-green-500' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: FileText, color: 'bg-yellow-500' },
    { label: 'Team KPI Average', value: `${stats.teamKpiAvg}%`, icon: BarChart3, color: 'bg-purple-500' },
    { label: 'Open Jobs', value: stats.openJobs, icon: Briefcase, color: 'bg-orange-500' },
    { label: 'Active Complaints', value: stats.activeComplaints, icon: MessageSquare, color: 'bg-red-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user?.username || 'Manager'}</h1>
      <p className="text-gray-600 mb-6">Team Overview</p>
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

export default ManagerDashboard;
