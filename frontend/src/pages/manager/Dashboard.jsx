import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BsPeople, BsClipboardCheck, BsHandThumbsUp, BsGraphUp, BsCheckCircle, BsCreditCard, BsCalendarCheck, BsGear } from 'react-icons/bs'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import DashboardLayout from '../../components/DashboardLayout'
import { employeeAPI } from '../../services/api'

const ManagerDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    teamSize: 0,
    presentToday: 0,
    pendingApprovals: 0,
    avgKPI: 0,
  })
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await employeeAPI.getAll()
        const employees = response.data || []
        setStats({
          teamSize: employees.length,
          presentToday: Math.floor(employees.length * 0.85),
          pendingApprovals: 3,
          avgKPI: 82,
        })
        setTeamMembers(employees.slice(0, 5))
      } catch (error) {
        console.error('Failed to fetch stats', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Manager Dashboard</h1>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); navigate('/admin/employees'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsPeople size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Total</span>
          </div>
          <div className="text-3xl font-bold">{stats.teamSize}</div>
          <div className="text-sm text-teal-100 mt-1">Team Size</div>
          <div className="text-xs text-teal-200 mt-2">View Team →</div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); navigate('/manager/attendance'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsClipboardCheck size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Today</span>
          </div>
          <div className="text-3xl font-bold">{stats.presentToday}</div>
          <div className="text-sm text-green-100 mt-1">Present Today</div>
          <div className="text-xs text-green-200 mt-2">View →</div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); navigate('/leave/approvals'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsHandThumbsUp size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Pending</span>
          </div>
          <div className="text-3xl font-bold">{stats.pendingApprovals}</div>
          <div className="text-sm text-amber-100 mt-1">Pending Approvals</div>
          <div className="text-xs text-amber-200 mt-2">Review →</div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); navigate('/kpi/manage'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsGraphUp size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Avg</span>
          </div>
          <div className="text-3xl font-bold">{stats.avgKPI}%</div>
          <div className="text-sm text-red-100 mt-1">Team Avg KPI</div>
          <div className="text-xs text-red-200 mt-2">Manage →</div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members Table */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Team Members</h3>
              <button onClick={() => { window.scrollTo(0, 0); navigate('/admin/employees'); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</button>
            </div>
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-200 rounded-lg"></div>
                ))}
              </div>
            ) : teamMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Department</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(member => (
                      <tr
                        key={member.id || member._id}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        onClick={() => { window.scrollTo(0, 0); navigate(`/admin/employees/${member.id || member._id}`); }}
                      >
                        <td className="py-3 px-3 text-sm font-medium text-slate-900">{member.firstName} {member.lastName}</td>
                        <td className="py-3 px-3 text-sm text-slate-600">{member.department || '-'}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                            {member.employmentType || 'Permanent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">No team members found.</p>
            )}
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <div>
          <Card className="h-full">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => { window.scrollTo(0, 0); navigate('/leave/approvals'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-green-100 rounded-lg"><BsCheckCircle size={18} className="text-green-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Review Leaves</div>
                  <div className="text-xs text-slate-500">{stats.pendingApprovals} pending</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); navigate('/manager/attendance'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-blue-100 rounded-lg"><BsClipboardCheck size={18} className="text-blue-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Manage Attendance</div>
                  <div className="text-xs text-slate-500">Today's records</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); navigate('/kpi/manage'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-purple-100 rounded-lg"><BsGraphUp size={18} className="text-purple-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Set KPI Goals</div>
                  <div className="text-xs text-slate-500">Performance metrics</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); navigate('/payroll/disburse'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-amber-100 rounded-lg"><BsCreditCard size={18} className="text-amber-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Disburse Payroll</div>
                  <div className="text-xs text-slate-500">Process payments</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); navigate('/manager/leaves'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-teal-100 rounded-lg"><BsCalendarCheck size={18} className="text-teal-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Leave Overview</div>
                  <div className="text-xs text-slate-500">Team leave balance</div>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ManagerDashboard
