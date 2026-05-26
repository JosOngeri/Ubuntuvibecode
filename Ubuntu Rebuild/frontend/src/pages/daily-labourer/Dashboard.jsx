import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { Calendar, DollarSign, User } from 'lucide-react';

const DailyLabourerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    daysWorkedThisMonth: 0,
    unpaidWages: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [attRes, payRes] = await Promise.all([
          api.get('/daily-labourers/attendance'),
          api.get('/payments?payeeType=daily_labourer'),
        ]);
        setStats({
          daysWorkedThisMonth: attRes.data.filter(a => a.status === 'present').length || 0,
          unpaidWages: attRes.data.filter(a => !a.isPaid).reduce((sum, a) => sum + (a.wageForDay || 0), 0) || 0,
          totalEarnings: payRes.data.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Days Worked This Month', value: stats.daysWorkedThisMonth, icon: Calendar, color: 'bg-green-500' },
    { label: 'Unpaid Wages (KES)', value: stats.unpaidWages.toLocaleString(), icon: DollarSign, color: 'bg-yellow-500' },
    { label: 'Total Earnings (KES)', value: stats.totalEarnings.toLocaleString(), icon: DollarSign, color: 'bg-purple-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user?.username || 'Labourer'}</h1>
      <p className="text-gray-600 mb-6">Your Work Overview</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

export default DailyLabourerDashboard;
