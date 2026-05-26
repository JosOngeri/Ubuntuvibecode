import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BsPeople, BsClipboardCheck, BsCreditCard, BsGraphUp, BsCalendarCheck,
  BsHandThumbsUp, BsGear, BsFileText, BsGrid, BsBriefcase, BsPieChart,
  BsBarChart, BsTrophy, BsCalendar, BsCalendarX, BsCheckCircle, BsXCircle,
  BsClock, BsCurrencyDollar, BsPersonCheck, BsPersonCircle, BsWallet, BsCash,
  BsFileEarmarkText, BsBullseye, BsCloudUpload
} from 'react-icons/bs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import DashboardLayout from '../../components/DashboardLayout'
import DashboardShell from '../../components/common/DashboardShell'
import StatsCards from '../../components/common/StatsCards'
import DataTable from '../../components/common/DataTable'
import QuickActions from '../../components/common/QuickActions'
import ChartContainer from '../../components/common/ChartContainer'
import CalendarHeatmap from '../../components/common/CalendarHeatmap'
import api, { employeeAPI, attendanceAPI, leaveAPI, contractorAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const ROLE_CONFIG = {
  admin: {
    title: 'Admin Dashboard',
    subtitle: 'System-wide management and oversight',
    icon: BsBriefcase,
    persistKey: 'admin-dashboard',
  },
  manager: {
    title: 'Manager Dashboard',
    subtitle: 'Team management and oversight',
    icon: BsBriefcase,
    persistKey: 'manager-dashboard',
  },
  supervisor: {
    title: 'Supervisor Dashboard',
    subtitle: 'Manage your team\'s attendance and performance',
    icon: BsBriefcase,
    persistKey: 'supervisor-dashboard',
  },
  employee: {
    titlePrefix: true, // uses firstName
    subtitle: 'Your personal workspace',
    icon: BsBriefcase,
    persistKey: 'employee-dashboard',
  },
  contractor: {
    title: 'Contractor Dashboard',
    subtitle: 'Projects and invoices management',
    icon: BsBriefcase,
    persistKey: 'contractor-dashboard',
  },
  daily_labourer: {
    title: 'Daily Labourer Dashboard',
    subtitlePrefix: true, // dynamic
    icon: BsBriefcase,
    persistKey: 'daily-labourer-dashboard',
  },
}

const RoleDashboard = ({ role = 'employee', standalone = true }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.employee

  // ── Unified state ──
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Common data
  const [employees, setEmployees] = useState([])
  const [payrolls, setPayrolls] = useState([])
  const [kpis, setKpis] = useState([])
  const [todayAttendance, setTodayAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [recentEmployees, setRecentEmployees] = useState([])

  // Manager / Supervisor
  const [teamMembers, setTeamMembers] = useState([])
  const [recentAttendance, setRecentAttendance] = useState([])

  // Employee
  const [attendanceData, setAttendanceData] = useState([])
  const [payslips, setPayslips] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [mySupervisor, setMySupervisor] = useState(null)

  // Contractor
  const [contractorStats, setContractorStats] = useState({
    activeProjects: 0, pendingInvoices: 0, deliveryRate: 0, totalEarnings: 0,
    upcomingDeadlines: 0, completedProjects: 0, averageRating: 0, pendingPayments: 0,
  })

  // Daily labourer
  const [labourer, setLabourer] = useState(null)
  const [paymentData, setPaymentData] = useState([])

  // Charts
  const [employeeChart, setEmployeeChart] = useState([])
  const [payrollChart, setPayrollChart] = useState([])

  // ── Dynamic fetch ──
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        if (role === 'admin' || role === 'manager') {
          const [empRes, payrollRes, kpiRes, attRes, leaveRes] = await Promise.all([
            employeeAPI.getAll().catch(() => ({ data: [] })),
            api.get('/api/payroll').catch(() => ({ data: [] })),
            api.get('/api/kpis/all').catch(() => ({ data: [] })),
            api.get('/api/attendance/today').catch(() => ({ data: [] })),
            api.get('/api/leave').catch(() => ({ data: [] })),
          ])
          const emps = empRes?.data || []
          const pays = payrollRes?.data || []
          const ks = kpiRes?.data || []
          const att = attRes?.data || []
          const lvs = leaveRes?.data || []

          setEmployees(emps)
          setPayrolls(pays)
          setKpis(ks)
          setTodayAttendance(att)
          setLeaves(lvs)
          setRecentEmployees(emps.slice(-5).reverse())

          const roleCount = emps.reduce((acc, emp) => {
            const r = emp.role || emp.department || 'Employee'
            acc[r] = (acc[r] || 0) + 1
            return acc
          }, {})
          setEmployeeChart(Object.keys(roleCount).map(key => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: roleCount[key] })))
          setPayrollChart(pays.slice(0, 6).map(p => ({ name: p.first_name || 'Emp', Gross: p.gross_pay || 0, Net: p.net_pay || 0 })))

          if (role === 'manager') {
            setTeamMembers(emps.slice(0, 5))
          }
        }

        else if (role === 'supervisor') {
          const [teamRes, attRes] = await Promise.all([
            api.get('/roles/supervisor/team').catch(() => ({ data: { employees: [], dailyLabourers: [] } })),
            api.get('/roles/supervisor/team-attendance').catch(() => ({ data: [] })),
          ])
          const teamData = teamRes?.data || { employees: [], dailyLabourers: [] }
          const allMembers = [...(teamData.employees || []), ...(teamData.dailyLabourers || [])]
          setTeamMembers(allMembers)
          const attData = attRes?.data || []
          setRecentAttendance(attData.slice(0, 10))
        }

        else if (role === 'employee') {
          const [empRes, leaveRes, supRes] = await Promise.all([
            employeeAPI.getMe().catch(() => ({ data: null })),
            leaveAPI.getBalance().catch(() => ({ data: { annual: 0 } })),
            api.get('/supervisor-allocations/me/supervisors').catch(() => ({ data: [] })),
          ])
          const empData = empRes?.data
          setEmployees(empData ? [empData] : [])

          const attRes = await attendanceAPI.getMyAttendance().catch(() => ({ data: [] }))
          setAttendanceData(attRes.data || [])

          const supervisors = supRes?.data || []
          const activeSupervisor = supervisors.find(s => s.isActive) || supervisors[0]
          setMySupervisor(activeSupervisor || null)

          setRecentActivity([
            { id: 1, type: 'attendance', message: 'Attendance recorded today', time: 'Just now' },
            { id: 2, type: 'leave', message: 'Leave balance updated', time: '2 days ago' },
            { id: 3, type: 'kpi', message: 'KPI score updated', time: '1 week ago' },
          ])
        }

        else if (role === 'contractor') {
          const statsRes = await contractorAPI.getStats().catch(() => ({
            data: { activeProjects: 0, pendingInvoices: 0, deliveryRate: 0, totalEarnings: 0, upcomingDeadlines: 0, completedProjects: 0, averageRating: 0, pendingPayments: 0 }
          }))
          setContractorStats(statsRes.data || {})
        }

        else if (role === 'daily_labourer') {
          if (!user?.id) throw new Error('User not authenticated')
          const labourerRes = await api.get(`/daily-labourers/by-user/${user.id}`).catch(() => ({ data: null }))
          const labourerData = labourerRes.data
          setLabourer(labourerData)

          if (labourerData?.id) {
            const labourerId = labourerData.id
            const [attRes, payRes] = await Promise.all([
              api.get(`/daily-labourers/${labourerId}/attendance`).catch(() => ({ data: [] })),
              api.get(`/daily-labourers/${labourerId}/payments`).catch(() => ({ data: [] })),
            ])
            setAttendanceData(attRes.data || [])
            setPaymentData(payRes.data || [])
          }
        }
      } catch (err) {
        const msg = err?.response?.data?.msg || err?.response?.data?.error || err?.message || 'Failed to load dashboard data'
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [role, user?.id])

  // ── Derived stats ──
  const evaluatedKpis = kpis.filter(k => k.final_score !== null && k.final_score !== undefined)
  const realAvgKPI = evaluatedKpis.length > 0
    ? Math.round(evaluatedKpis.reduce((sum, k) => sum + Number(k.final_score), 0) / evaluatedKpis.length)
    : 0
  const presentToday = todayAttendance.length || 0
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length
  const pendingPayroll = payrolls.filter(p => p.status === 'Draft').length

  const presentDays = attendanceData.filter(a => a.status === 'present').length
  const absentDays = attendanceData.filter(a => a.status === 'absent').length
  const totalEarnings = paymentData.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const pendingPayments = paymentData.filter(p => p.status === 'pending').length
  const attendanceRate = presentDays + absentDays > 0
    ? Math.round((presentDays / (presentDays + absentDays)) * 100)
    : 0

  // ── Stats cards per role ──
  const getStatsCards = () => {
    if (role === 'admin') return [
      { key: 'employees', label: 'Total Employees', value: employees.length, icon: BsPeople, onClick: () => navigate('/admin/people') },
      { key: 'present', label: 'Present Today', value: presentToday, icon: BsClipboardCheck, onClick: () => navigate('/admin/attendance') },
      { key: 'payroll', label: 'Pending Payroll', value: pendingPayroll, icon: BsCreditCard, onClick: () => navigate('/admin/payroll') },
      { key: 'kpi', label: 'Avg KPI Score', value: `${realAvgKPI}%`, icon: BsGraphUp, onClick: () => navigate('/admin/performance') },
    ]
    if (role === 'manager') return [
      { key: 'team', label: 'Team Size', value: employees.length, icon: BsPeople },
      { key: 'present', label: 'Present Today', value: presentToday, icon: BsClipboardCheck, onClick: () => navigate('/manager/attendance') },
      { key: 'approvals', label: 'Pending Approvals', value: pendingLeaves || 3, icon: BsHandThumbsUp, onClick: () => navigate('/leave/approvals') },
      { key: 'kpi', label: 'Team Avg KPI', value: `${realAvgKPI || 82}%`, icon: BsGraphUp, onClick: () => navigate('/kpi/manage') },
    ]
    if (role === 'supervisor') return [
      { key: 'employees', label: 'Employees', value: teamMembers.filter(m => m.type !== 'Daily Labourer').length, icon: BsPeople },
      { key: 'labourers', label: 'Daily Labourers', value: teamMembers.filter(m => m.type === 'Daily Labourer').length, icon: BsPeople },
      { key: 'present', label: 'Present Today', value: recentAttendance.filter(a => a.status === 'present').length, icon: BsCheckCircle, onClick: () => navigate('/manager/attendance') },
      { key: 'absent', label: 'Absent Today', value: recentAttendance.filter(a => a.status === 'absent').length, icon: BsXCircle, onClick: () => navigate('/manager/attendance') },
    ]
    if (role === 'employee') return [
      { key: 'attendance', label: 'Attendance Days', value: presentDays, icon: BsClipboardCheck, onClick: () => navigate('/employee/attendance') },
      { key: 'leave', label: 'Leave Balance', value: leaves?.[0]?.balance || 0, icon: BsCalendarCheck, onClick: () => navigate('/employee/leaves') },
      { key: 'pending', label: 'Pending Leaves', value: pendingLeaves, icon: BsCalendarX, onClick: () => navigate('/leave/request') },
      { key: 'kpi', label: 'KPI Score', value: `${realAvgKPI || 85}%`, icon: BsBullseye, onClick: () => navigate('/kpi/my-goals') },
    ]
    if (role === 'contractor') return [
      { key: 'active', label: 'Active Projects', value: contractorStats.activeProjects, icon: BsBriefcase, onClick: () => navigate('/contractor/projects') },
      { key: 'invoices', label: 'Pending Invoices', value: contractorStats.pendingInvoices, icon: BsFileEarmarkText, onClick: () => navigate('/contractor/invoices') },
      { key: 'delivery', label: 'Delivery Rate', value: `${contractorStats.deliveryRate}%`, icon: BsGraphUp, onClick: () => navigate('/contractor/reports') },
      { key: 'earnings', label: 'Total Earnings', value: `KES ${contractorStats.totalEarnings?.toLocaleString() || 0}`, icon: BsCurrencyDollar, onClick: () => navigate('/contractor/invoices') },
    ]
    if (role === 'daily_labourer') return [
      { key: 'present', label: 'Days Present', value: presentDays, icon: BsCheckCircle },
      { key: 'absent', label: 'Days Absent', value: absentDays, icon: BsXCircle },
      { key: 'earnings', label: 'Total Earnings', value: `KES ${totalEarnings.toLocaleString()}`, icon: BsCash },
      { key: 'pending', label: 'Pending Payments', value: pendingPayments, icon: BsClock },
    ]
    return []
  }

  // ── Quick actions per role ──
  const getQuickActions = () => {
    if (role === 'admin') return [
      { key: 'leaves', label: 'Approve Leaves', description: `${pendingLeaves} pending`, icon: BsCalendarCheck, route: '/admin/leaves' },
      { key: 'payroll', label: 'Generate Payroll', description: `${pendingPayroll} pending`, icon: BsCreditCard, route: '/admin/payroll' },
      { key: 'complaints', label: 'View Complaints', description: `0 open`, icon: BsHandThumbsUp, route: '/admin/complaints' },
      { key: 'attendance', label: 'Check Attendance', description: "Today's records", icon: BsClipboardCheck, route: '/admin/attendance' },
      { key: 'kpis', label: 'Review KPIs', description: 'Performance metrics', icon: BsGraphUp, route: '/admin/kpis' },
      { key: 'settings', label: 'Settings', description: 'System config', icon: BsGear, route: '/admin/settings' },
    ]
    if (role === 'manager') return [
      { key: 'leaves', label: 'Review Leaves', description: `${pendingLeaves || 3} pending`, icon: BsCheckCircle, route: '/leave/approvals' },
      { key: 'attendance', label: 'Manage Attendance', description: "Today's records", icon: BsClipboardCheck, route: '/manager/attendance' },
      { key: 'kpi', label: 'Set KPI Goals', description: 'Performance metrics', icon: BsGraphUp, route: '/kpi/manage' },
      { key: 'payroll', label: 'Disburse Payroll', description: 'Process payments', icon: BsCreditCard, route: '/payroll/disburse' },
      { key: 'leave-overview', label: 'Leave Overview', description: 'Team leave balance', icon: BsCalendarCheck, route: '/manager/leaves' },
    ]
    if (role === 'supervisor') return [
      { key: 'attendance', label: 'View Full Attendance', description: "Today's records", icon: BsClipboardCheck, route: '/manager/attendance' },
      { key: 'team', label: 'Manage Team', description: `${teamMembers.length} members`, icon: BsPeople, route: '/admin/employees' },
    ]
    if (role === 'employee') return [
      { key: 'punch', label: 'Quick Punch', description: 'Record attendance', icon: BsPersonCheck, route: '/employee/punch' },
      { key: 'leave', label: 'Request Leave', description: 'Submit new request', icon: BsCalendarX, route: '/leave/request' },
      { key: 'profile', label: 'My Profile', description: 'View & edit profile', icon: BsPersonCircle, route: '/profile/view' },
      { key: 'payslips', label: 'My Payslips', description: 'View salary history', icon: BsFileText, route: '/payroll/payslips' },
    ]
    if (role === 'contractor') return [
      { key: 'portal', label: 'Submit Milestone', description: 'Upload deliverables', icon: BsCheckCircle, route: '/contractor/portal' },
      { key: 'invoices', label: 'View Invoices', description: `${contractorStats.pendingInvoices} pending`, icon: BsFileEarmarkText, route: '/contractor/invoices' },
      { key: 'kpi', label: 'My KPI', description: 'Performance metrics', icon: BsGraphUp, route: '/contractor/reports' },
      { key: 'projects', label: 'My Projects', description: `${contractorStats.activeProjects} active`, icon: BsBriefcase, route: '/contractor/projects' },
    ]
    if (role === 'daily_labourer') return [
      { key: 'attendance', label: 'View Attendance', description: `${presentDays} days recorded`, icon: BsCalendarCheck, route: '/daily-labour/attendance' },
      { key: 'payments', label: 'View Payments', description: `${pendingPayments} pending`, icon: BsWallet, route: '/daily-labour/payments' },
    ]
    return []
  }

  // ── Tab renderers ──
  const renderOverviewTab = () => {
    const statsCards = getStatsCards()
    const quickActions = getQuickActions()

    const welcomeTitle = config.titlePrefix
      ? `${user?.firstName || 'Welcome'}'s Dashboard`
      : config.title

    const subtitleText = config.subtitlePrefix
      ? `Welcome, ${user?.name || user?.username} — ${labourer?.skill_set || 'General Labour'}`
      : config.subtitle

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">{welcomeTitle}</h2>
          <p className="text-orange-100">{subtitleText}</p>
        </div>

        <StatsCards stats={statsCards} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
            <QuickActions actions={quickActions} layout="row" />
          </div>

          {role === 'admin' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">API Status</span>
                  <span className="text-green-500 text-sm font-medium">● Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Database</span>
                  <span className="text-green-500 text-sm font-medium">● Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Last Sync</span>
                  <span className="text-sm text-slate-900 dark:text-white">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}

          {role === 'manager' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Team Performance</h3>
              <div className="space-y-4">
                {[
                  { label: 'Attendance Rate', value: '85%', color: 'bg-green-500' },
                  { label: 'KPI Achievement', value: '82%', color: 'bg-blue-500' },
                  { label: 'Leave Utilization', value: '45%', color: 'bg-amber-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: item.value }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {role === 'employee' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">My Supervisor</h3>
              {mySupervisor ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <BsPersonCheck size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {mySupervisor.supervisorName || `Supervisor #${mySupervisor.supervisorId}`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {mySupervisor.type === 'permanent' ? 'Permanent allocation' : `Allocation type: ${mySupervisor.type}`}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/messages')}
                      className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200 transition-colors"
                    >
                      Message
                    </button>
                  </div>
                  {mySupervisor.notes && (
                    <p className="text-xs text-slate-500 px-1">{mySupervisor.notes}</p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-500 py-2">No supervisor assigned yet.</div>
              )}
            </div>
          )}

          {role === 'employee' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      {activity.type === 'attendance' && <BsClipboardCheck size={18} className="text-orange-600 dark:text-orange-400" />}
                      {activity.type === 'leave' && <BsCalendarCheck size={18} className="text-orange-600 dark:text-orange-400" />}
                      {activity.type === 'kpi' && <BsBullseye size={18} className="text-orange-600 dark:text-orange-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{activity.message}</div>
                      <div className="text-xs text-slate-500">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {role === 'contractor' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Performance Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Completed Projects</span>
                  <span className="font-medium text-slate-900 dark:text-white">{contractorStats.completedProjects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Average Rating</span>
                  <span className="font-medium text-slate-900 dark:text-white">{contractorStats.averageRating}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Upcoming Deadlines</span>
                  <span className="font-medium text-slate-900 dark:text-white">{contractorStats.upcomingDeadlines}</span>
                </div>
              </div>
            </div>
          )}

          {role === 'daily_labourer' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Profile Summary</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Daily Rate', value: labourer?.daily_rate ? `KES ${parseFloat(labourer.daily_rate).toLocaleString()}` : 'N/A' },
                  { label: 'Status', value: labourer?.status || 'N/A' },
                  { label: 'Attendance Rate', value: `${attendanceRate}%` },
                  { label: 'Total Days Recorded', value: presentDays + absentDays },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {role === 'supervisor' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => navigate('/manager/attendance')} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-left">
                  <BsClipboardCheck className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">View Full Attendance</span>
                </button>
                <button onClick={() => navigate('/admin/employees')} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-left">
                  <BsPeople className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Manage Team</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderEmployeesTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{role === 'admin' ? 'Employee Management' : 'Team Members'}</h2>
        <p className="text-teal-100">{role === 'admin' ? 'View and manage all employees' : 'Manage and view your team members'}</p>
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Name', sortable: true },
          { key: 'department', label: 'Department', sortable: true },
          { key: 'type', label: 'Type', sortable: true, render: (val) => (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{val}</span>
          )},
        ]}
        data={recentEmployees.map(emp => ({
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department || '-',
          type: emp.employmentType || 'Permanent',
        }))}
        onRowClick={(row) => navigate(`/admin/employees/${row.id}`)}
      />
    </div>
  )

  const renderTeamTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">My Team</h2>
        <p className="text-teal-100">{teamMembers.length} members assigned to you</p>
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Name', sortable: true },
          { key: 'type', label: 'Type', sortable: true },
          { key: 'department', label: 'Department', sortable: true },
        ]}
        data={teamMembers.map(member => ({
          id: member.id,
          name: `${member.first_name || member.firstName} ${member.last_name || member.lastName}`,
          type: member.type || 'Employee',
          department: member.department || '-',
        }))}
      />
    </div>
  )

  const renderAttendanceTab = () => {
    if (role === 'employee') {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Attendance Overview</h2>
            <p className="text-teal-100">Your attendance record for the past few months</p>
          </div>
          <CalendarHeatmap attendance={attendanceData} dateJoined={user?.dateJoined} months={3} />
        </div>
      )
    }
    if (role === 'supervisor') {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Today&apos;s Attendance</h2>
            <p className="text-green-100">Team attendance records for today</p>
          </div>
          <DataTable
            columns={[
              { key: 'name', label: 'Name', sortable: true },
              { key: 'time', label: 'Time', sortable: true, render: (val, row) => (
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {row.check_in && `In: ${new Date(row.check_in).toLocaleTimeString()}`}
                  {row.check_out && ` Out: ${new Date(row.check_out).toLocaleTimeString()}`}
                </span>
              )},
              { key: 'status', label: 'Status', sortable: true, render: (val) => (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  val === 'present' ? 'bg-green-100 text-green-700' :
                  val === 'absent' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{val}</span>
              )},
            ]}
            data={recentAttendance.map(a => ({
              id: a.id,
              name: a.name || 'Unknown',
              check_in: a.check_in,
              check_out: a.check_out,
              status: a.status,
            }))}
          />
        </div>
      )
    }
    if (role === 'daily_labourer') {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Attendance History</h2>
            <p className="text-green-100">{attendanceData.length} record(s) found</p>
          </div>
          {attendanceData.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <BsCalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No attendance records found</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Check In</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Check Out</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {attendanceData.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{new Date(a.date).toLocaleDateString('en-KE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.check_in ? new Date(a.check_in).toLocaleTimeString() : '—'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.check_out ? new Date(a.check_out).toLocaleTimeString() : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          a.status === 'present' ? 'bg-green-100 text-green-700' :
                          a.status === 'absent' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    }
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Attendance Overview</h2>
          <p className="text-green-100">{role === 'admin' ? "Today's attendance records" : 'Team attendance records and patterns'}</p>
        </div>
        <div className="text-center py-12 text-slate-500">
          <BsClipboardCheck size={48} className="mx-auto mb-4 opacity-50" />
          <p>Attendance data will be displayed here</p>
          <button onClick={() => navigate(role === 'admin' ? '/admin/attendance' : '/manager/attendance')} className="mt-4 text-orange-500 hover:text-orange-600">View Full Attendance →</button>
        </div>
      </div>
    )
  }

  const renderPayrollTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Payroll Management</h2>
        <p className="text-amber-100">Process and manage payroll</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{pendingPayroll}</div>
          <div className="text-sm text-slate-500">Pending Payroll</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{employees.length}</div>
          <div className="text-sm text-slate-500">Total Employees</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">Active</div>
          <div className="text-sm text-slate-500">Payroll Cycle</div>
        </div>
      </div>
      <button onClick={() => navigate('/admin/payroll')} className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">Manage Payroll</button>
    </div>
  )

  const renderKPITab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">KPI Management</h2>
        <p className="text-purple-100">Track and manage performance metrics</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{realAvgKPI || 82}%</div>
          <div className="text-sm text-slate-500">Average KPI Score</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{employees.length}</div>
          <div className="text-sm text-slate-500">Employees Evaluated</div>
        </div>
      </div>
      <button onClick={() => navigate(role === 'admin' ? '/admin/performance' : '/kpi/manage')} className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">Manage KPIs</button>
    </div>
  )

  const renderLeavesTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Leave Management</h2>
        <p className="text-amber-100">Review and manage team leave requests</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{pendingLeaves || 3}</div>
          <div className="text-sm text-slate-500">Pending Approvals</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">12</div>
          <div className="text-sm text-slate-500">Approved This Month</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">5</div>
          <div className="text-sm text-slate-500">On Leave Today</div>
        </div>
      </div>
      <button onClick={() => navigate('/leave/approvals')} className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">Review Pending Leaves</button>
    </div>
  )

  const renderEmployeeLeavesTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Leave Management</h2>
        <p className="text-green-100">Manage your leave requests and balances</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{leaves?.[0]?.balance || 0}</div>
          <div className="text-sm text-slate-500">Annual Leave Balance</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{pendingLeaves}</div>
          <div className="text-sm text-slate-500">Pending Requests</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">0</div>
          <div className="text-sm text-slate-500">Approved This Year</div>
        </div>
      </div>
      <button onClick={() => navigate('/leave/request')} className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">Request New Leave</button>
    </div>
  )

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Analytics & Reports</h2>
        <p className="text-blue-100">System-wide analytics and insights</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Payroll Payouts</h3>
          <ChartContainer className="h-72 w-full min-h-[288px]">
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
          </ChartContainer>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Employee Distribution</h3>
          <ChartContainer className="h-72 w-full min-h-[288px]">
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
          </ChartContainer>
        </div>
      </div>
    </div>
  )

  const renderProjectsTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">My Projects</h2>
        <p className="text-teal-100">Manage your active and completed projects</p>
      </div>
      <div className="text-center py-12 text-slate-500">
        <BsBriefcase size={48} className="mx-auto mb-4 opacity-50" />
        <p>Project list will be displayed here</p>
        <button onClick={() => navigate('/contractor/projects')} className="mt-4 text-orange-500 hover:text-orange-600">View All Projects →</button>
      </div>
    </div>
  )

  const renderInvoicesTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Invoices & Payments</h2>
        <p className="text-green-100">Track your invoices and payments</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{contractorStats.pendingInvoices}</div>
          <div className="text-sm text-slate-500">Pending Invoices</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{contractorStats.pendingPayments}</div>
          <div className="text-sm text-slate-500">Pending Payments</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">KES {contractorStats.totalEarnings?.toLocaleString() || 0}</div>
          <div className="text-sm text-slate-500">Total Earnings</div>
        </div>
      </div>
      <button onClick={() => navigate('/contractor/invoices')} className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">Manage Invoices</button>
    </div>
  )

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Performance Metrics</h2>
        <p className="text-purple-100">Track your delivery rate and ratings</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{contractorStats.deliveryRate}%</div>
          <div className="text-sm text-slate-500">Delivery Rate</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{contractorStats.averageRating}/5</div>
          <div className="text-sm text-slate-500">Average Rating</div>
        </div>
      </div>
    </div>
  )

  const renderPayslipsTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Salary & Payslips</h2>
        <p className="text-blue-100">View your salary history and download payslips</p>
      </div>
      <div className="text-center py-12 text-slate-500">
        <BsFileText size={48} className="mx-auto mb-4 opacity-50" />
        <p>No payslips available yet</p>
        <button onClick={() => navigate('/payroll/payslips')} className="mt-4 text-orange-500 hover:text-orange-600">View Full History →</button>
      </div>
    </div>
  )

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Payment History</h2>
        <p className="text-blue-100">{paymentData.length} record(s) found</p>
      </div>
      {paymentData.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <BsWallet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No payment records found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Days</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paymentData.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{new Date(p.payment_date || p.date || p.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">KES {parseFloat(p.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.days_worked || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                      p.status === 'paid' ? 'bg-green-100 text-green-700' :
                      p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  // ── Tabs per role ──
  const getTabs = () => {
    const allTabs = {
      overview: { id: 'overview', label: 'Overview', icon: BsGrid, render: renderOverviewTab },
      employees: { id: 'employees', label: 'Employees', icon: BsPeople, render: renderEmployeesTab },
      team: { id: 'team', label: 'Team Members', icon: BsPeople, render: renderTeamTab },
      attendance: { id: 'attendance', label: 'Attendance', icon: BsClipboardCheck, render: renderAttendanceTab },
      payroll: { id: 'payroll', label: 'Payroll', icon: BsCreditCard, render: renderPayrollTab },
      kpis: { id: 'kpis', label: 'KPIs', icon: BsGraphUp, render: renderKPITab },
      analytics: { id: 'analytics', label: 'Analytics', icon: BsPieChart, render: renderAnalyticsTab },
      leaves: { id: 'leaves', label: 'Leaves', icon: BsCalendar, render: renderLeavesTab },
      employeeLeaves: { id: 'leaves', label: 'Leaves', icon: BsCalendarCheck, render: renderEmployeeLeavesTab },
      payslips: { id: 'payslips', label: 'Payslips', icon: BsFileText, render: renderPayslipsTab },
      projects: { id: 'projects', label: 'Projects', icon: BsBriefcase, render: renderProjectsTab },
      invoices: { id: 'invoices', label: 'Invoices', icon: BsFileEarmarkText, render: renderInvoicesTab },
      performance: { id: 'performance', label: 'Performance', icon: BsBarChart, render: renderPerformanceTab },
      payments: { id: 'payments', label: 'Payments', icon: BsWallet, render: renderPaymentsTab },
    }

    const roleTabs = {
      admin: ['overview', 'employees', 'attendance', 'payroll', 'kpis', 'analytics'],
      manager: ['overview', 'team', 'attendance', 'leaves', 'kpis'],
      supervisor: ['overview', 'team', 'attendance'],
      employee: ['overview', 'attendance', 'employeeLeaves', 'payslips'],
      contractor: ['overview', 'projects', 'invoices', 'performance'],
      daily_labourer: ['overview', 'attendance', 'payments'],
    }

    return (roleTabs[role] || []).map(key => allTabs[key]).filter(Boolean)
  }

  const tabs = getTabs()

  const content = (
    <DashboardShell
      title={config.titlePrefix ? `${user?.firstName || 'Welcome'}'s Dashboard` : config.title}
      subtitle={config.subtitlePrefix ? `Welcome, ${user?.name || user?.username} — ${labourer?.skill_set || 'General Labour'}` : config.subtitle}
      role={role}
      icon={config.icon}
      tabs={tabs}
      loading={loading}
      error={error}
      onRetry={() => window.location.reload()}
      persistKey={config.persistKey}
    />
  )

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content
}

export default RoleDashboard
