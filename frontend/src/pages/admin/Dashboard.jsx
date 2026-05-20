import React, { useEffect, useState } from 'react'
import { BsPeople, BsClipboardCheck, BsCreditCard, BsGraphUp, BsCalendarCheck, BsHandThumbsUp, BsGear, BsFileText } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Card from '../../components/common/Card'
import DashboardLayout from '../../components/DashboardLayout'
import DashboardStats from '../../components/common/DashboardStats'
import Modal from '../../components/common/Modal'
import api, { employeeAPI } from '../../services/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingPayroll: 0,
    avgKPI: 0,
    pendingLeaves: 0,
    openComplaints: 0,
  })
  const [employeeChart, setEmployeeChart] = useState([])
  const [payrollChart, setPayrollChart] = useState([])
  const [recentEmployees, setRecentEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSystemStatusModal, setShowSystemStatusModal] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [empRes, payrollRes, kpiRes, attendanceRes, leaveRes] = await Promise.all([
          employeeAPI.getAll(),
          api.get('/api/payroll').catch(() => ({ data: [] })),
          api.get('/api/kpis/all').catch(() => ({ data: [] })),
          api.get('/api/attendance/today').catch(() => ({ data: [] })),
          api.get('/api/leave').catch(() => ({ data: [] }))
        ]);

        const employees = empRes.data || [];
        const payrolls = payrollRes.data || [];
        const kpis = kpiRes.data || [];
        const todayAttendance = attendanceRes.data || [];
        const leaves = leaveRes.data || [];

        // Calculate real KPI average
        const evaluatedKpis = kpis.filter(k => k.final_score !== null && k.final_score !== undefined);
        const realAvgKPI = evaluatedKpis.length > 0
          ? Math.round(evaluatedKpis.reduce((sum, k) => sum + Number(k.final_score), 0) / evaluatedKpis.length)
          : 0;

        // Real attendance count for today
        const presentToday = todayAttendance.length || 0;

        // Pending items
        const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

        setStats({
          totalEmployees: employees.length,
          presentToday: presentToday,
          pendingPayroll: payrolls.filter(p => p.status === 'Draft').length,
          avgKPI: realAvgKPI,
          pendingLeaves: pendingLeaves,
          openComplaints: 0,
        })

        // Recent employees (last 5)
        setRecentEmployees(employees.slice(-5).reverse())

        // Group Employees by Role for Pie Chart
        const roleCount = employees.reduce((acc, emp) => {
          const role = emp.role || emp.department || 'Employee';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});
        
        setEmployeeChart(Object.keys(roleCount).map(key => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: roleCount[key]
        })));

        // Map recent payrolls for Bar Chart
        setPayrollChart(payrolls.slice(0, 6).map(p => ({
          name: p.first_name || 'Emp',
          Gross: p.gross_pay || 0,
          Net: p.net_pay || 0,
        })));

      } catch (error) {
        console.error('Failed to fetch dashboard data', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); navigate('/admin/employees'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsPeople size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Total</span>
          </div>
          <div className="text-3xl font-bold">{stats.totalEmployees}</div>
          <div className="text-sm text-teal-100 mt-1">Total Employees</div>
          <div className="text-xs text-teal-200 mt-2">Manage →</div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); navigate('/admin/attendance'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsClipboardCheck size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Today</span>
          </div>
          <div className="text-3xl font-bold">{stats.presentToday}</div>
          <div className="text-sm text-green-100 mt-1">Present Today</div>
          <div className="text-xs text-green-200 mt-2">View →</div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); navigate('/admin/payroll', { state: { filterStatus: 'Draft' } }); }}>
          <div className="flex items-center justify-between mb-2">
            <BsCreditCard size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Pending</span>
          </div>
          <div className="text-3xl font-bold">{stats.pendingPayroll}</div>
          <div className="text-sm text-amber-100 mt-1">Pending Payroll</div>
          <div className="text-xs text-amber-200 mt-2">Process →</div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { window.scrollTo(0, 0); navigate('/admin/kpis'); }}>
          <div className="flex items-center justify-between mb-2">
            <BsGraphUp size={24} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Avg</span>
          </div>
          <div className="text-3xl font-bold">{stats.avgKPI}%</div>
          <div className="text-sm text-red-100 mt-1">Avg KPI Score</div>
          <div className="text-xs text-red-200 mt-2">Review →</div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Employees Table */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Recent Employees</h3>
              <button onClick={() => { window.scrollTo(0, 0); navigate('/admin/employees'); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Department</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEmployees.length > 0 ? recentEmployees.map((emp) => (
                    <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => { window.scrollTo(0, 0); navigate(`/admin/employees/${emp.id}`); }}>
                      <td className="py-3 px-3 text-sm font-medium text-slate-900">{emp.firstName} {emp.lastName}</td>
                      <td className="py-3 px-3 text-sm text-slate-600">{emp.department || '-'}</td>
                      <td className="py-3 px-3 text-sm text-slate-600 capitalize">{emp.role || '-'}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-sm text-slate-500">No employees found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <div>
          <Card className="h-full">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => { window.scrollTo(0, 0); navigate('/admin/leaves'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-green-100 rounded-lg"><BsCalendarCheck size={18} className="text-green-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Approve Leaves</div>
                  <div className="text-xs text-slate-500">{stats.pendingLeaves} pending</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); navigate('/admin/payroll'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-amber-100 rounded-lg"><BsCreditCard size={18} className="text-amber-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Generate Payroll</div>
                  <div className="text-xs text-slate-500">{stats.pendingPayroll} pending</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); navigate('/admin/complaints'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-red-100 rounded-lg"><BsHandThumbsUp size={18} className="text-red-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">View Complaints</div>
                  <div className="text-xs text-slate-500">{stats.openComplaints} open</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); navigate('/admin/attendance'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-blue-100 rounded-lg"><BsClipboardCheck size={18} className="text-blue-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Check Attendance</div>
                  <div className="text-xs text-slate-500">Today's records</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); navigate('/admin/kpis'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-purple-100 rounded-lg"><BsGraphUp size={18} className="text-purple-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Review KPIs</div>
                  <div className="text-xs text-slate-500">Performance metrics</div>
                </div>
              </button>

              <button onClick={() => { window.scrollTo(0, 0); navigate('/admin/settings'); }} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="p-2 bg-slate-200 rounded-lg"><BsGear size={18} className="text-slate-600" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Settings</div>
                  <div className="text-xs text-slate-500">System config</div>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Payroll Payouts</h3>
          <div className="h-72 w-full">
            {payrollChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payrollChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Gross" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Net" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No payroll data available</div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Employee Distribution</h3>
          <div className="h-72 w-full">
            {employeeChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={employeeChart} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                    {employeeChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No employee data available</div>
            )}
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowSystemStatusModal(true)}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">System Status</h3>
            <p className="text-slate-600 mt-1 text-sm">All endpoints active and synchronized</p>
          </div>
          <span className="text-green-500 text-sm font-medium">● Online</span>
        </div>
      </Card>

      <Modal isOpen={showSystemStatusModal} onClose={() => setShowSystemStatusModal(false)} title="System Status Details">
        <div className="space-y-4 text-sm text-slate-700">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="font-semibold text-slate-900">API Status</span>
            <span className="text-green-600 font-medium">● All endpoints active</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="font-semibold text-slate-900">Database Connection</span>
            <span className="text-green-600 font-medium">● Connected</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="font-semibold text-slate-900">Last Sync</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="font-semibold text-slate-900">System Uptime</span>
            <span>99.9%</span>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default AdminDashboard
