import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, Users, Calendar, DollarSign, FileText, Activity } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const roleRoutes = {
      admin: '/admin/dashboard',
      owner: '/owner/dashboard',
      manager: '/manager/dashboard',
      employee: '/employee/dashboard',
      daily_labourer: '/daily-labourer/dashboard',
      contractor: '/contractor/dashboard',
    };
    if (roleRoutes[user.role]) {
      navigate(roleRoutes[user.role]);
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Activity className="mx-auto mb-4 text-blue-600" size={64} />
        <h1 className="text-2xl font-bold text-gray-800">Welcome to Ubuntu HRMS</h1>
        <p className="text-gray-600 mt-2">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default Dashboard;
