import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, BarChart3,
  FileText, ArrowRight, Calendar, Users, AlertCircle,
  CheckCircle, Clock, Plus, Download, RefreshCw
} from 'lucide-react'
import Card from '../../components/common/Card'
import { FullPageLoading, InlineLoading } from '../../components/common/Loading'
import { EmptyState } from '../../components/common/EmptyState'

const TreasuryDashboard = () => {
  const { user, api } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    fundBalance: 0,
    pendingExpenses: 0,
    budgetVariance: 0
  })
  const [recentTransactions, setRecentTransactions] = useState([])
  const [budgetAlerts, setBudgetAlerts] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])

  const hasTreasuryAccess = user?.roles?.some(role => 
    ['Super Admin', 'Pastor', 'First Elder', 'Treasurer'].includes(role)
  )

  useEffect(() => {
    if (hasTreasuryAccess) {
      fetchTreasuryData()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchTreasuryData = async () => {
    try {
      setLoading(true)
      
      // Fetch treasury stats
      const statsResponse = await api.get('/treasury/stats')
      if (statsResponse.data) {
        setStats(statsResponse.data)
      }

      // Fetch recent transactions
      const transactionsResponse = await api.get('/treasury/journal-entries?limit=5')
      if (transactionsResponse.data) {
        setRecentTransactions(transactions.data.entries || [])
      }

      // Fetch budget alerts
      const alertsResponse = await api.get('/treasury/budgets/alerts')
      if (alertsResponse.data) {
        setBudgetAlerts(alerts.data.alerts || [])
      }

      // Fetch pending approvals
      const approvalsResponse = await api.get('/treasury/expenses?status=pending')
      if (approvalsResponse.data) {
        setPendingApprovals(approvalsResponse.data.expenses || [])
      }
    } catch (error) {
      console.error('Failed to fetch treasury data:', error)
      toast.error('Failed to load treasury data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTreasuryData()
    setRefreshing(false)
    toast.success('Dashboard refreshed')
  }

  const quickActions = [
    {
      title: 'Create Journal Entry',
      description: 'Record financial transactions',
      icon: Plus,
      color: 'bg-green-100 text-green-600',
      link: '/dashboard/treasury/journal-entries'
    },
    {
      title: 'Submit Expense',
      description: 'Create expense request',
      icon: DollarSign,
      color: 'bg-blue-100 text-blue-600',
      link: '/dashboard/treasury/expenses'
    },
    {
      title: 'View Reports',
      description: 'Financial reports',
      icon: FileText,
      color: 'bg-purple-100 text-purple-600',
      link: '/dashboard/treasury/reports'
    },
    {
      title: 'Manage Budgets',
      description: 'Budget tracking',
      icon: BarChart3,
      color: 'bg-orange-100 text-orange-600',
      link: '/dashboard/treasury/budgets'
    }
  ]

  if (!hasTreasuryAccess) {
    return (
      <div className="flex items-center justify-center h-96">
        <EmptyState
          icon={AlertCircle}
          title="Access Denied"
          description="You don't have permission to access the treasury dashboard."
        />
      </div>
    )
  }

  if (loading) {
    return <FullPageLoading message="Loading treasury dashboard..." />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Treasury Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Financial overview and management
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">
                +12% from last month
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              KES {stats.totalIncome.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-sm text-red-600 font-medium">
                +8% from last month
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              KES {stats.totalExpenses.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm text-blue-600 font-medium">
                Current balance
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Net Income</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              KES {stats.netIncome.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm text-purple-600 font-medium">
                All funds
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Fund Balance</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              KES {stats.fundBalance.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm text-yellow-600 font-medium">
                {pendingApprovals.length} pending
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Expenses</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              KES {stats.pendingExpenses.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm text-orange-600 font-medium">
                {budgetAlerts.length} alerts
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Budget Variance</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              KES {stats.budgetVariance.toLocaleString()}
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                to={action.link}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow group h-full flex flex-col"
              >
                <div className={`inline-flex p-3 rounded-lg ${action.color} mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-auto">
                  {action.description}
                </p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Transactions & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Journal Entries
            </h2>
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {entry.entry_number}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {entry.entry_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        KES {entry.total_debit.toLocaleString()}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        entry.status === 'posted' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))}
                <Link
                  to="/dashboard/treasury/journal-entries"
                  className="flex items-center justify-center space-x-2 text-sm text-blue-600 hover:text-blue-700 mt-4"
                >
                  <span>View all entries</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No recent entries"
                description="Start by creating your first journal entry."
              />
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pending Expense Approvals
            </h2>
            {pendingApprovals.length > 0 ? (
              <div className="space-y-4">
                {pendingApprovals.slice(0, 5).map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {expense.expense_number}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {expense.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {expense.expense_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        KES {expense.amount.toLocaleString()}
                      </p>
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
                <Link
                  to="/dashboard/treasury/expenses"
                  className="flex items-center justify-center space-x-2 text-sm text-blue-600 hover:text-blue-700 mt-4"
                >
                  <span>View all pending</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="No pending approvals"
                description="All expenses have been processed."
              />
            )}
          </div>
        </Card>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Budget Alerts
            </h2>
            <div className="space-y-3">
              {budgetAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                >
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {alert.budget_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {alert.message}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">
                    {alert.percentage_used}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default TreasuryDashboard
