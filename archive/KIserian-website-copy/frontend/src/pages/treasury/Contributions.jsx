import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  Search, Filter, ChevronDown, Download, RefreshCw,
  User, Calendar, DollarSign, TrendingUp
} from 'lucide-react'
import Card from '../../components/common/Card'
import { FullPageLoading } from '../../components/common/Loading'
import { EmptyState } from '../../components/common/EmptyState'

const Contributions = () => {
  const { api } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [contributions, setContributions] = useState([])
  const [filteredContributions, setFilteredContributions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterYear, setFilterYear] = useState('all')
  const [filterMember, setFilterMember] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [members, setMembers] = useState([])

  useEffect(() => {
    fetchContributions()
    fetchMembers()
  }, [])

  useEffect(() => {
    filterContributions()
  }, [searchTerm, filterYear, filterMember, contributions])

  const fetchContributions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/treasury/contributions')
      if (response.data) {
        setContributions(response.data.contributions || [])
      }
    } catch (error) {
      console.error('Failed to fetch contributions:', error)
      toast.error('Failed to load contributions')
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await api.get('/users')
      if (response.data) {
        setMembers(response.data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    }
  }

  const filterContributions = () => {
    let filtered = [...contributions]

    if (searchTerm) {
      filtered = filtered.filter(contribution =>
        contribution.member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contribution.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterYear !== 'all') {
      filtered = filtered.filter(contribution => contribution.year === parseInt(filterYear))
    }

    if (filterMember !== 'all') {
      filtered = filtered.filter(contribution => contribution.member_id === filterMember)
    }

    setFilteredContributions(filtered)
  }

  const handleDownload = async () => {
    try {
      const response = await api.get('/treasury/export/contributions', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'contributions.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Contributions exported successfully')
    } catch (error) {
      console.error('Failed to export contributions:', error)
      toast.error('Failed to export contributions')
    }
  }

  const getTotalContributions = () => {
    return filteredContributions.reduce((sum, contribution) => sum + (parseFloat(contribution.amount) || 0), 0)
  }

  if (loading) {
    return <FullPageLoading message="Loading contributions..." />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Member Contributions</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track member giving and generate statements
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Contributions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  KES {getTotalContributions().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Contributors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(filteredContributions.map(c => c.member_id)).size}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredContributions.length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contributions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={fetchContributions}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Years</option>
                  {[2024, 2025, 2026, 2027].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Member
                </label>
                <select
                  value={filterMember}
                  onChange={(e) => setFilterMember(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Members</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Contributions List */}
      <Card>
        {filteredContributions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Member</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Category</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Fund</th>
                </tr>
              </thead>
              <tbody>
                {filteredContributions.map((contribution) => (
                  <tr key={contribution.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {new Date(contribution.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {contribution.member_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {contribution.category}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white font-semibold">
                      KES {parseFloat(contribution.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {contribution.fund_name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={DollarSign}
            title="No contributions found"
            description="No contribution records match the current filters."
          />
        )}
      </Card>
    </div>
  )
}

export default Contributions
