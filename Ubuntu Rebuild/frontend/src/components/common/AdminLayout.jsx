import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Users, Calendar, DollarSign, FileText, Settings, LogOut, BarChart3, Briefcase, Building, FolderOpen, Shield, ClipboardList, Wrench, GraduationCap, FileCheck, UserCheck, MessageSquare, Activity, Database } from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/admin/employees', icon: Users, label: 'Employees' },
    { path: '/admin/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/admin/leaves', icon: FileText, label: 'Leave Management' },
    { path: '/admin/payroll', icon: DollarSign, label: 'Payroll' },
    { path: '/admin/kpi', icon: BarChart3, label: 'KPI' },
    { path: '/admin/jobs', icon: Briefcase, label: 'Recruitment' },
    { path: '/admin/onboarding', icon: UserCheck, label: 'Onboarding' },
    { path: '/admin/complaints', icon: MessageSquare, label: 'Complaints' },
    { path: '/admin/contractors', icon: Building, label: 'Contractors' },
    { path: '/admin/contracts', icon: FileCheck, label: 'Contracts' },
    { path: '/admin/assets', icon: Wrench, label: 'Assets' },
    { path: '/admin/training', icon: GraduationCap, label: 'Training' },
    { path: '/admin/documents', icon: FolderOpen, label: 'Document Vault' },
    { path: '/admin/orientation', icon: ClipboardList, label: 'Orientation' },
    { path: '/admin/reports', icon: Activity, label: 'Reports' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
    { path: '/admin/logs', icon: Database, label: 'System Logs' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Ubuntu HRMS</h1>
          <p className="text-sm text-gray-400">Admin Panel</p>
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
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.username || 'Admin'}</p>
              <p className="text-xs text-gray-400">{user?.role || 'admin'}</p>
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

export default AdminLayout;
