import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Users, Calendar, FileText, DollarSign, BarChart3, Briefcase, Building, FolderOpen, LogOut, MessageSquare, Wrench, GraduationCap, UserCheck, ClipboardList } from 'lucide-react';

const ManagerLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/manager/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/manager/employees', icon: Users, label: 'Team' },
    { path: '/manager/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/manager/leaves', icon: FileText, label: 'Leave Approvals' },
    { path: '/manager/kpi', icon: BarChart3, label: 'Team KPI' },
    { path: '/manager/jobs', icon: Briefcase, label: 'Recruitment' },
    { path: '/manager/onboarding', icon: UserCheck, label: 'Onboarding' },
    { path: '/manager/complaints', icon: MessageSquare, label: 'Complaints' },
    { path: '/manager/contractors', icon: Building, label: 'Contractors' },
    { path: '/manager/assets', icon: Wrench, label: 'Assets' },
    { path: '/manager/training', icon: GraduationCap, label: 'Training' },
    { path: '/manager/orientation', icon: ClipboardList, label: 'Orientation' },
    { path: '/manager/documents', icon: FolderOpen, label: 'Documents' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Ubuntu HRMS</h1>
          <p className="text-sm text-gray-400">Manager Portal</p>
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
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              {user?.username?.[0]?.toUpperCase() || 'M'}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.username || 'Manager'}</p>
              <p className="text-xs text-gray-400">{user?.role || 'manager'}</p>
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

export default ManagerLayout;
