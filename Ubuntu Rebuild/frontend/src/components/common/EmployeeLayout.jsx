import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Calendar, FileText, DollarSign, User, LogOut, GraduationCap, FolderOpen, ClipboardList, MessageSquare } from 'lucide-react';

const EmployeeLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/employee/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/employee/attendance', icon: Calendar, label: 'My Attendance' },
    { path: '/employee/leaves', icon: FileText, label: 'Leave Requests' },
    { path: '/employee/payroll', icon: DollarSign, label: 'My Payroll' },
    { path: '/employee/kpi', icon: GraduationCap, label: 'My KPI' },
    { path: '/employee/documents', icon: FolderOpen, label: 'My Documents' },
    { path: '/employee/orientation', icon: ClipboardList, label: 'Orientation' },
    { path: '/employee/complaints', icon: MessageSquare, label: 'Complaints' },
    { path: '/employee/profile', icon: User, label: 'My Profile' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Ubuntu HRMS</h1>
          <p className="text-sm text-gray-400">Employee Portal</p>
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
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              {user?.username?.[0]?.toUpperCase() || 'E'}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.username || 'Employee'}</p>
              <p className="text-xs text-gray-400">{user?.role || 'employee'}</p>
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

export default EmployeeLayout;
