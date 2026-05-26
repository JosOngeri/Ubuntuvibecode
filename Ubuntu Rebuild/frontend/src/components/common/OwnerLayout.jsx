import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Users, Calendar, DollarSign, BarChart3, Briefcase, Building, Settings, LogOut, FileText, Activity, Database, Shield, Wrench, GraduationCap, FolderOpen, ClipboardList, MessageSquare, UserCheck } from 'lucide-react';

const OwnerLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/owner/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/owner/employees', icon: Users, label: 'All Employees' },
    { path: '/owner/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/owner/leaves', icon: FileText, label: 'Leave Management' },
    { path: '/owner/payroll', icon: DollarSign, label: 'Payroll' },
    { path: '/owner/kpi', icon: BarChart3, label: 'KPI Overview' },
    { path: '/owner/jobs', icon: Briefcase, label: 'Recruitment' },
    { path: '/owner/onboarding', icon: UserCheck, label: 'Onboarding' },
    { path: '/owner/complaints', icon: MessageSquare, label: 'Complaints' },
    { path: '/owner/contractors', icon: Building, label: 'Contractors' },
    { path: '/owner/contracts', icon: Shield, label: 'Contracts' },
    { path: '/owner/assets', icon: Wrench, label: 'Assets' },
    { path: '/owner/training', icon: GraduationCap, label: 'Training' },
    { path: '/owner/documents', icon: FolderOpen, label: 'Document Vault' },
    { path: '/owner/orientation', icon: ClipboardList, label: 'Orientation' },
    { path: '/owner/reports', icon: Activity, label: 'Reports' },
    { path: '/owner/settings', icon: Settings, label: 'Settings' },
    { path: '/owner/logs', icon: Database, label: 'System Logs' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Ubuntu HRMS</h1>
          <p className="text-sm text-gray-400">Owner Portal</p>
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
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              {user?.username?.[0]?.toUpperCase() || 'O'}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.username || 'Owner'}</p>
              <p className="text-xs text-gray-400">{user?.role || 'owner'}</p>
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

export default OwnerLayout;
