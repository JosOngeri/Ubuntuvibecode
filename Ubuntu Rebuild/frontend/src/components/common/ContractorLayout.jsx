import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Briefcase, DollarSign, LogOut, User, FileText, ClipboardList } from 'lucide-react';

const ContractorLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/contractor/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/contractor/quotes', icon: Briefcase, label: 'My Quotes' },
    { path: '/contractor/milestones', icon: ClipboardList, label: 'Milestones' },
    { path: '/contractor/payments', icon: DollarSign, label: 'My Payments' },
    { path: '/contractor/profile', icon: User, label: 'My Profile' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Ubuntu HRMS</h1>
          <p className="text-sm text-gray-400">Contractor Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600' : 'hover:bg-gray-800'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
              {user?.username?.[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.username || 'Contractor'}</p>
              <p className="text-xs text-gray-400">{user?.role || 'contractor'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg w-full"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default ContractorLayout;
