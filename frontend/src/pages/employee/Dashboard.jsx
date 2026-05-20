import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BsClipboardCheck, BsCalendarCheck, BsFileText, BsPersonCircle, BsPersonCheck, BsCalendarX, BsBullseye, BsHandThumbsUp, BsClipboard, BsBriefcase } from 'react-icons/bs'
import DashboardLayout from '../../components/DashboardLayout'
import { attendanceAPI, employeeAPI, leaveAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

const EmployeeDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const firstName = user?.firstName || 'Welcome'
  const [punchLoading, setPunchLoading] = useState(false)
  const [stats, setStats] = useState({
    attendanceCount: 0,
    leaveBalance: 0,
    pendingLeaves: 0,
    kpiScore: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, leaveRes] = await Promise.all([
          employeeAPI.getMe().catch(() => ({ data: null })),
          leaveAPI.getBalance().catch(() => ({ data: { annual: 0 } })),
        ])
        setStats({
          attendanceCount: empRes.data?.attendanceCount || 0,
          leaveBalance: leaveRes.data?.annual || 0,
          pendingLeaves: leaveRes.data?.pending || 0,
          kpiScore: empRes.data?.kpiScore || 85,
        })
      } catch (e) {
        console.error('Failed to fetch stats', e)
      }
    }
    fetchStats()
  }, [])

  const handleQuickPunch = async (e) => {
    e.stopPropagation()
    setPunchLoading(true)
    try {
      const deviceId = localStorage.getItem('biometricDeviceId') || 'BIO-001'
      await attendanceAPI.manualSelfPunch({
        biometricDeviceId: deviceId,
        punchState: 'checkOut',
      })
      toast.success('Punch recorded successfully')
    } catch (error) {
      toast.error('Failed to record punch')
    } finally {
      setPunchLoading(false)
    }
  }

  const goTo = (path) => {
    window.scrollTo(0, 0)
    navigate(path)
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{firstName}'s Dashboard</h1>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); goTo('/employee/attendance'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsClipboardCheck size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Days</span>
          </div>
          <div className="text-3xl font-bold">{stats.attendanceCount}</div>
          <div className="text-sm text-teal-100 mt-1">Attendance Days</div>
          <div className="text-xs text-teal-200 mt-2">View →</div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); goTo('/employee/leaves'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsCalendarCheck size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Balance</span>
          </div>
          <div className="text-3xl font-bold">{stats.leaveBalance}</div>
          <div className="text-sm text-green-100 mt-1">Leave Balance</div>
          <div className="text-xs text-green-200 mt-2">Manage →</div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); goTo('/leave/request'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsCalendarX size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Pending</span>
          </div>
          <div className="text-3xl font-bold">{stats.pendingLeaves}</div>
          <div className="text-sm text-amber-100 mt-1">Pending Leaves</div>
          <div className="text-xs text-amber-200 mt-2">Request →</div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); goTo('/kpi/my-goals'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsBullseye size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Score</span>
          </div>
          <div className="text-3xl font-bold">{stats.kpiScore}%</div>
          <div className="text-sm text-red-100 mt-1">KPI Score</div>
          <div className="text-xs text-red-200 mt-2">View →</div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
              <button onClick={() => { window.scrollTo(0, 0); goTo('/employee/attendance'); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg"><BsClipboardCheck size={18} className="text-blue-600" /></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">Attendance recorded today</div>
                  <div className="text-xs text-slate-500">Just now</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg"><BsCalendarCheck size={18} className="text-green-600" /></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">Leave balance updated</div>
                  <div className="text-xs text-slate-500">2 days ago</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg"><BsBullseye size={18} className="text-purple-600" /></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">KPI score updated</div>
                  <div className="text-xs text-slate-500">1 week ago</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <div>
          <Card className="h-full">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={handleQuickPunch} disabled={punchLoading} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left disabled:opacity-50">
                <div className="p-2 bg-blue-100 rounded-lg"><BsPersonCheck size={18} className="text-blue-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Quick Punch</div>
                  <div className="text-xs text-slate-500">{punchLoading ? 'Recording...' : 'Record attendance'}</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); goTo('/leave/request'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-amber-100 rounded-lg"><BsCalendarX size={18} className="text-amber-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Request Leave</div>
                  <div className="text-xs text-slate-500">Submit new request</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); goTo('/profile/view'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-purple-100 rounded-lg"><BsPersonCircle size={18} className="text-purple-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">My Profile</div>
                  <div className="text-xs text-slate-500">View & edit profile</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); goTo('/payroll/payslips'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-teal-100 rounded-lg"><BsFileText size={18} className="text-teal-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">My Payslips</div>
                  <div className="text-xs text-slate-500">View salary history</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); goTo('/admin/complaints'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-red-100 rounded-lg"><BsHandThumbsUp size={18} className="text-red-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Submit Complaint</div>
                  <div className="text-xs text-slate-500">Report an issue</div>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default EmployeeDashboard
