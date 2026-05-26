import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  FileText, Download, Calendar, Filter, ChevronDown,
  RefreshCw, BarChart3, TrendingUp, Wallet, PieChart
} from 'lucide-react'
import Card from '../../components/common/Card'
import { FullPageLoading } from '../../components/common/Loading'
import { EmptyState } from '../../components/common/EmptyState'

const FinancialReports = () => {
  const { api } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState('trial-balance')
  const [reportData, setReportData] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const reportTypes = [
    { value: 'trial-balance', label: 'Trial Balance', icon: BarChart3 },
    { value: 'income-statement', label: 'Income Statement', icon: TrendingUp },
    { value: 'balance-sheet', label: 'Balance Sheet', icon: Wallet },
    { value: 'fund-balances', label: 'Fund Balances', icon: PieChart }
  ]

  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    setDateFrom(firstDay.toISOString().split('T')[0])
    setDateTo(today.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchReport()
    }
  }, [selectedReport, dateFrom, dateTo])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/treasury/reports/${selectedReport}`, {
        params: { date_from: dateFrom, date_to: dateTo }
      })
      if (response.data) {
        setReportData(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch report:', error)
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await api.get(`/treasury/export/${selectedReport}`, {
        params: { date_from: dateFrom, date_to: dateTo },
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${selectedReport}-${dateFrom}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Report downloaded successfully')
    } catch (error) {
      console.error('Failed to download report:', error)
      toast.error('Failed to download report')
    }
  }

  const renderReportContent = () => {
    if (!reportData) return null

    switch (selectedReport) {
      case 'trial-balance':
        return renderTrialBalance()
      case 'income-statement':
        return renderIncomeStatement()
      case 'balance-sheet':
        return renderBalanceSheet()
      case 'fund-balances':
        return renderFundBalances()
      default:
        return null
    }
  }

  const renderTrialBalance = () => {
    if (!reportData.accounts) return null
    
    return (
      <div className="space-y-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Account</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Debit</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Credit</th>
            </tr>
          </thead>
          <tbody>
            {reportData.accounts.map((account, index) => (
              <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  {account.account_number} - {account.account_name}
                </td>
                <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                  {account.debit ? `KES ${parseFloat(account.debit).toLocaleString()}` : '-'}
                </td>
                <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                  {account.credit ? `KES ${parseFloat(account.credit).toLocaleString()}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Total</td>
              <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                KES {parseFloat(reportData.total_debit || 0).toLocaleString()}
              </td>
              <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                KES {parseFloat(reportData.total_credit || 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  const renderIncomeStatement = () => {
    if (!reportData.line_items) return null
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue</h3>
          {reportData.line_items
            .filter(item => item.type === 'income')
            .map((item, index) => (
              <div key={index} className="flex justify-between py-2 px-4 bg-green-50 dark:bg-green-900/20 rounded">
                <span className="text-sm text-gray-900 dark:text-white">{item.name}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  KES {parseFloat(item.amount).toLocaleString()}
                </span>
              </div>
            ))}
          <div className="flex justify-between py-2 px-4 bg-green-100 dark:bg-green-900/30 rounded font-semibold">
            <span className="text-gray-900 dark:text-white">Total Revenue</span>
            <span className="text-gray-900 dark:text-white">
              KES {parseFloat(reportData.total_income || 0).toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expenses</h3>
          {reportData.line_items
            .filter(item => item.type === 'expense')
            .map((item, index) => (
              <div key={index} className="flex justify-between py-2 px-4 bg-red-50 dark:bg-red-900/20 rounded">
                <span className="text-sm text-gray-900 dark:text-white">{item.name}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  KES {parseFloat(item.amount).toLocaleString()}
                </span>
              </div>
            ))}
          <div className="flex justify-between py-2 px-4 bg-red-100 dark:bg-red-900/30 rounded font-semibold">
            <span className="text-gray-900 dark:text-white">Total Expenses</span>
            <span className="text-gray-900 dark:text-white">
              KES {parseFloat(reportData.total_expenses || 0).toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between py-4 px-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <span className="text-lg font-bold text-gray-900 dark:text-white">Net Income</span>
          <span className={`text-lg font-bold ${reportData.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            KES {parseFloat(reportData.net_income || 0).toLocaleString()}
          </span>
        </div>
      </div>
    )
  }

  const renderBalanceSheet = () => {
    if (!reportData.line_items) return null
    
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assets</h3>
          {reportData.line_items
            .filter(item => item.type === 'asset')
            .map((item, index) => (
              <div key={index} className="flex justify-between py-2 px-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span className="text-sm text-gray-900 dark:text-white">{item.name}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  KES {parseFloat(item.amount).toLocaleString()}
                </span>
              </div>
            ))}
          <div className="flex justify-between py-2 px-4 bg-blue-100 dark:bg-blue-900/30 rounded font-semibold">
            <span className="text-gray-900 dark:text-white">Total Assets</span>
            <span className="text-gray-900 dark:text-white">
              KES {parseFloat(reportData.total_assets || 0).toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Liabilities</h3>
          {reportData.line_items
            .filter(item => item.type === 'liability')
            .map((item, index) => (
              <div key={index} className="flex justify-between py-2 px-4 bg-red-50 dark:bg-red-900/20 rounded">
                <span className="text-sm text-gray-900 dark:text-white">{item.name}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  KES {parseFloat(item.amount).toLocaleString()}
                </span>
              </div>
            ))}
          <div className="flex justify-between py-2 px-4 bg-red-100 dark:bg-red-900/30 rounded font-semibold">
            <span className="text-gray-900 dark:text-white">Total Liabilities</span>
            <span className="text-gray-900 dark:text-white">
              KES {parseFloat(reportData.total_liabilities || 0).toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Equity</h3>
          {reportData.line_items
            .filter(item => item.type === 'equity')
            .map((item, index) => (
              <div key={index} className="flex justify-between py-2 px-4 bg-purple-50 dark:bg-purple-900/20 rounded">
                <span className="text-sm text-gray-900 dark:text-white">{item.name}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  KES {parseFloat(item.amount).toLocaleString()}
                </span>
              </div>
            ))}
          <div className="flex justify-between py-2 px-4 bg-purple-100 dark:bg-purple-900/30 rounded font-semibold">
            <span className="text-gray-900 dark:text-white">Total Equity</span>
            <span className="text-gray-900 dark:text-white">
              KES {parseFloat(reportData.total_equity || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const renderFundBalances = () => {
    if (!reportData.funds) return null
    
    return (
      <div className="space-y-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Fund</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Type</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Balance</th>
            </tr>
          </thead>
          <tbody>
            {reportData.funds.map((fund, index) => (
              <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  {fund.fund_name}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                  {fund.fund_type}
                </td>
                <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white font-semibold">
                  KES {parseFloat(fund.balance).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white" colSpan="2">Total</td>
              <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                KES {parseFloat(reportData.total_balance || 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate and download financial reports
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Download PDF</span>
        </button>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon
          return (
            <button
              key={report.value}
              onClick={() => setSelectedReport(report.value)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedReport === report.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Icon className={`h-6 w-6 ${
                  selectedReport === report.value ? 'text-blue-600' : 'text-gray-600'
                }`} />
                <span className={`text-sm font-medium ${
                  selectedReport === report.value ? 'text-blue-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {report.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={fetchReport}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Generate</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Report Content */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {reportTypes.find(r => r.value === selectedReport)?.label}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {dateFrom} to {dateTo}
            </span>
          </div>
          
          {loading ? (
            <FullPageLoading message="Generating report..." />
          ) : reportData ? (
            renderReportContent()
          ) : (
            <EmptyState
              icon={FileText}
              title="No report data available"
              description="Select a date range and generate a report."
            />
          )}
        </div>
      </Card>
    </div>
  )
}

export default FinancialReports
