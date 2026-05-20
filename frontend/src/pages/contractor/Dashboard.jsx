import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BsBriefcase, 
  BsFileEarmarkText, 
  BsGraphUp, 
  BsClockHistory,
  BsCurrencyDollar,
  BsCalendarCheck,
  BsCheckCircle,
  BsPerson
} from 'react-icons/bs'
import DashboardLayout from '../../components/DashboardLayout'
import { contractorAPI } from '../../services/api'
import { toast } from 'react-toastify'

const ContractorDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingInvoices: 0,
    deliveryRate: 0,
    totalEarnings: 0,
    upcomingDeadlines: 0,
    completedProjects: 0,
    averageRating: 0,
    pendingPayments: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsResponse = await contractorAPI.getStats()
        setStats(statsResponse.data)
      } catch (error) {
        console.error('Failed to fetch contractor dashboard data', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const goTo = (path) => {
    window.scrollTo(0, 0)
    navigate(path)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading contractor dashboard...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Contractor Dashboard</h1>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); goTo('/contractor/projects'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsBriefcase size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Active</span>
          </div>
          <div className="text-3xl font-bold">{stats.activeProjects}</div>
          <div className="text-sm text-teal-100 mt-1">Active Projects</div>
          <div className="text-xs text-teal-200 mt-2">Manage →</div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); goTo('/contractor/invoices'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsFileEarmarkText size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Pending</span>
          </div>
          <div className="text-3xl font-bold">{stats.pendingInvoices}</div>
          <div className="text-sm text-green-100 mt-1">Pending Invoices</div>
          <div className="text-xs text-green-200 mt-2">View →</div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); goTo('/contractor/reports'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsGraphUp size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Rate</span>
          </div>
          <div className="text-3xl font-bold">{stats.deliveryRate}%</div>
          <div className="text-sm text-amber-100 mt-1">Delivery Rate</div>
          <div className="text-xs text-amber-200 mt-2">Reports →</div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); goTo('/contractor/invoices'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsCurrencyDollar size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Total</span>
          </div>
          <div className="text-3xl font-bold">KES {stats.totalEarnings?.toLocaleString() || 0}</div>
          <div className="text-sm text-red-100 mt-1">Total Earnings</div>
          <div className="text-xs text-red-200 mt-2">View →</div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects Table */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Recent Projects</h3>
              <button onClick={() => { window.scrollTo(0, 0); goTo('/contractor/projects'); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg"><BsBriefcase size={18} className="text-blue-600" /></div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Website Development</div>
                    <div className="text-xs text-slate-500">Due in 5 days</div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">In Progress</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg"><BsBriefcase size={18} className="text-purple-600" /></div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Mobile App UI</div>
                    <div className="text-xs text-slate-500">Due in 2 weeks</div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">Pending</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg"><BsBriefcase size={18} className="text-green-600" /></div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Database Migration</div>
                    <div className="text-xs text-slate-500">Completed</div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800">Done</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <div>
          <Card className="h-full">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => { window.scrollTo(0, 0); goTo('/contractor/portal'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-blue-100 rounded-lg"><BsCheckCircle size={18} className="text-blue-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Submit Milestone</div>
                  <div className="text-xs text-slate-500">Upload deliverables</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); goTo('/contractor/invoices'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-amber-100 rounded-lg"><BsFileEarmarkText size={18} className="text-amber-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">View Invoices</div>
                  <div className="text-xs text-slate-500">{stats.pendingInvoices} pending</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); goTo('/contractor/reports'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-purple-100 rounded-lg"><BsGraphUp size={18} className="text-purple-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">My KPI</div>
                  <div className="text-xs text-slate-500">Performance metrics</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); goTo('/contractor/projects'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-teal-100 rounded-lg"><BsBriefcase size={18} className="text-teal-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">My Projects</div>
                  <div className="text-xs text-slate-500">{stats.activeProjects} active</div>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ContractorDashboard
