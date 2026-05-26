import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { Briefcase, DollarSign, ClipboardList, User } from 'lucide-react';

const ContractorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeQuotes: 0,
    pendingMilestones: 0,
    totalPayments: 0,
    completedMilestones: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [quoteRes, milestoneRes, payRes] = await Promise.all([
          api.get('/contractors/quotes'),
          api.get('/contractors/milestones'),
          api.get('/payments?payeeType=contractor'),
        ]);
        setStats({
          activeQuotes: quoteRes.data.filter(q => q.status === 'approved').length || 0,
          pendingMilestones: milestoneRes.data.filter(m => m.status === 'pending').length || 0,
          totalPayments: payRes.data.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
          completedMilestones: milestoneRes.data.filter(m => m.status === 'completed').length || 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Active Quotes', value: stats.activeQuotes, icon: Briefcase, color: 'bg-blue-500' },
    { label: 'Pending Milestones', value: stats.pendingMilestones, icon: ClipboardList, color: 'bg-yellow-500' },
    { label: 'Total Payments (KES)', value: stats.totalPayments.toLocaleString(), icon: DollarSign, color: 'bg-green-500' },
    { label: 'Completed Milestones', value: stats.completedMilestones, icon: ClipboardList, color: 'bg-purple-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user?.username || 'Contractor'}</h1>
      <p className="text-gray-600 mb-6">Your Project Overview</p>
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

export default ContractorDashboard;
