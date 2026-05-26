import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, Megaphone, CreditCard, DollarSign, Calendar, 
  Users, Settings, MessageSquare, Menu, X, User,
  Building, ChevronDown, UserCircle, Shield, Wallet,
  BarChart3, FileText, TrendingUp, CheckCircle, FolderKanban,
  Building2, Clock, Receipt
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [departmentsOpen, setDepartmentsOpen] = useState(false)
  const [treasuryOpen, setTreasuryOpen] = useState(false)

  const isActiveRoute = (path) => {
    return location.pathname.startsWith(path)
  }

  const menuItems = [
    { path: '/dashboard/overview', label: 'Dashboard', icon: Home },
    { path: '/dashboard/profile', label: 'My profile', icon: UserCircle },
    { path: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
    { path: '/dashboard/payments', label: 'Make Payment', icon: CreditCard },
    { path: '/dashboard/payment-history', label: 'Payment History', icon: DollarSign },
    { path: '/dashboard/events', label: 'Events', icon: Calendar },
    { path: '/dashboard/members', label: 'Member Directory', icon: Users },
  ]

  // Add department menu item if user has department access
  const hasDepartmentAccess = user?.roles?.some(role => 
    ['Super Admin', 'Pastor', 'First Elder', 'Department Head'].includes(role)
  )

  // Add treasury menu items if user has treasury access
  const hasTreasuryAccess = user?.roles?.some(role => 
    ['Super Admin', 'Pastor', 'First Elder', 'Treasurer'].includes(role)
  )

  // Add admin menu items if user has admin access
  const hasAdminAccess = user?.roles?.some(role => 
    ['Super Admin', 'Pastor', 'First Elder'].includes(role)
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-72 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:w-72 lg:h-full lg:flex-shrink-0 lg:shadow-none lg:z-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 dark:text-white">SDA Kiserian</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Member Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Main Menu Items */}
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActiveRoute(item.path)
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }
                `}
                onClick={onClose}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}

          {/* Departments Section */}
          {hasDepartmentAccess && (
            <div className="pt-2">
              <button
                onClick={() => setDepartmentsOpen(!departmentsOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5" />
                  <span className="font-medium">Departments</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${departmentsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {departmentsOpen && (
                <div className="ml-4 mt-2 space-y-1">
                  <Link
                    to="/dashboard/departments"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    All Departments
                  </Link>
                  <Link
                    to="/dashboard/my-departments"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    My Departments
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Treasury Section */}
          {hasTreasuryAccess && (
            <div className="pt-2">
              <button
                onClick={() => setTreasuryOpen(!treasuryOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <Wallet className="h-5 w-5" />
                  <span className="font-medium">Treasury</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${treasuryOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {treasuryOpen && (
                <div className="ml-4 mt-2 space-y-1">
                  <Link
                    to="/dashboard/treasury"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Treasury Dashboard
                  </Link>
                  <Link
                    to="/dashboard/treasury/accounts"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Chart of Accounts
                  </Link>
                  <Link
                    to="/dashboard/treasury/journal-entries"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Journal Entries
                  </Link>
                  <Link
                    to="/dashboard/treasury/budgets"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Budgets
                  </Link>
                  <Link
                    to="/dashboard/treasury/expenses"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Expenses
                  </Link>
                  <Link
                    to="/dashboard/treasury/reports"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Financial Reports
                  </Link>
                  <Link
                    to="/dashboard/treasury/funds"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Funds
                  </Link>
                  <Link
                    to="/dashboard/treasury/reconciliations"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Bank Reconciliations
                  </Link>
                  <Link
                    to="/dashboard/treasury/contributions"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Contributions
                  </Link>
                  <Link
                    to="/dashboard/treasury/vendors"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Vendors
                  </Link>
                  <Link
                    to="/dashboard/treasury/projects"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Projects
                  </Link>
                  <Link
                    to="/dashboard/treasury/assets"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Fixed Assets
                  </Link>
                  <Link
                    to="/dashboard/treasury/pledges"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Pledges
                  </Link>
                  <Link
                    to="/dashboard/treasury/recurring"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Recurring Payments
                  </Link>
                  <Link
                    to="/dashboard/treasury/receipts"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Receipts
                  </Link>
                  <Link
                    to="/dashboard/treasury/analytics"
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={onClose}
                  >
                    Treasury Analytics
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Admin Section */}
          {hasAdminAccess && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
              <Link
                to="/dashboard/admin"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <Settings className="h-5 w-5" />
                <span className="font-medium">Admin</span>
              </Link>
              <Link
                to="/dashboard/users"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">Users</span>
              </Link>
              <Link
                to="/dashboard/payment-management"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <DollarSign className="h-5 w-5" />
                <span className="font-medium">Payment management</span>
              </Link>
              <Link
                to="/dashboard/profile-management"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <Shield className="h-5 w-5" />
                <span className="font-medium">Account &amp; roles</span>
              </Link>
              <Link
                to="/dashboard/sms"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="font-medium">SMS</span>
              </Link>
              <Link
                to="/dashboard/admin/settings"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <Settings className="h-5 w-5" />
                <span className="font-medium">Site Settings</span>
              </Link>
            </div>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.roles?.join(', ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
