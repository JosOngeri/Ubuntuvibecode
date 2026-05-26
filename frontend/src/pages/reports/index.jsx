import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import DateDropdown from '../../components/common/DateDropdown'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { BsGraphUp, BsPeople, BsCalendarCheck, BsCash, BsClock, BsDownload } from 'react-icons/bs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PageInfoPanel from '../../components/common/PageInfoPanel'
import { ReportsEmptyState } from '../../components/common/EmptyState'

const REPORT_TYPES = [
  { k: 'attendance', l: 'Attendance' },
  { k: 'leave', l: 'Leave' },
  { k: 'payroll', l: 'Payroll' },
  { k: 'kpi', l: 'KPI' },
  { k: 'employee', l: 'Employees' },
  { k: 'recruitment', l: 'Recruitment' },
  { k: 'complaints', l: 'Complaints' },
  { k: 'daily-labour', l: 'Daily Labour' },
]

export default function ReportsPage({ standalone = true }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [type, setType] = useState('attendance')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState({ from: '', to: '' })
  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)
  const [dept, setDept] = useState('all')

  const getRouteForReportType = (reportType) => {
    const role = user?.role || 'admin'
    const routes = {
      attendance: role === 'admin' ? '/admin/attendance' : role === 'manager' || role === 'supervisor' ? '/manager/attendance' : '/employee/attendance',
      leave: role === 'admin' ? '/admin/leaves' : role === 'manager' || role === 'supervisor' ? '/manager/leaves' : '/employee/leaves',
      payroll: role === 'admin' ? '/admin/payroll' : '/payroll/disburse',
      kpi: role === 'admin' ? '/admin/kpis' : '/kpi/manage',
      employee: '/admin/employees',
      recruitment: '/recruitment/jobs',
      complaints: '/admin/complaints',
      'daily-labour': '/admin/daily-labour',
    }
    return routes[reportType] || '/'
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = {}
      if (range.from) params.from = range.from
      if (range.to) params.to = range.to
      if (dept !== 'all') params.department = dept
      const r = await api.get('/reports/' + type, { params }).catch(() => ({ data: null }))
      setData(r.data)
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReport() }, [type])

  const exportCSV = () => {
    if (!data?.rows?.length) return
    const headers = Object.keys(data.rows[0]).join(',')
    const rows = data.rows.map(r => Object.values(r).join(',')).join('\n')
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = type + '-report.csv'; a.click()
  }

  const exportPDF = async () => {
    try {
      const params = {}
      if (range.from) params.from = range.from
      if (range.to) params.to = range.to
      if (dept !== 'all') params.department = dept
      params.type = type

      const url = new URL(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports/pdf`)
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

      window.open(url.toString(), '_blank')
    } catch (err) {
      toast.error('Failed to generate PDF')
    }
  }

  const maxVal = data?.rows?.length ? Math.max(...data.rows.map(r => Object.values(r).find(v => typeof v === 'number') || 0), 1) : 1

  const content = (
    <div>
      <div className="page-header mb-6">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Dynamic reports with filtering and export.</p>
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <DateDropdown 
              selectedDate={fromDate}
              onDateChange={(date) => {
                setFromDate(date);
                setRange({...range, from: date ? date.toISOString().split('T')[0] : ''});
              }}
              label="From"
              showYear={true}
              showMonth={true}
              showDay={true}
              yearRange={5}
            />
          </div>
          <div>
            <DateDropdown 
              selectedDate={toDate}
              onDateChange={(date) => {
                setToDate(date);
                setRange({...range, to: date ? date.toISOString().split('T')[0] : ''});
              }}
              label="To"
              showYear={true}
              showMonth={true}
              showDay={true}
              yearRange={5}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Department</label>
            <select className="form-select text-sm" value={dept} onChange={e => setDept(e.target.value)}>
              <option value="all">All</option>
              <option value="Front Office">Front Office</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Farm">Farm</option>
              <option value="Grounds">Grounds</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <Button variant="primary" size="sm" onClick={fetchReport}>Generate</Button>
          {data?.rows?.length > 0 && <Button variant="outline" size="sm" onClick={exportCSV}><BsDownload className="mr-1"/>Export CSV</Button>}
          {data?.rows?.length > 0 && <Button variant="outline" size="sm" onClick={exportPDF}><BsDownload className="mr-1"/>Export PDF</Button>}
        </div>
      </Card>

      <div className="flex gap-2 mb-4 flex-wrap">
        {REPORT_TYPES.map(t => (
          <Button key={t.k} variant={type === t.k ? 'primary' : 'outline'} size="sm" onClick={() => setType(t.k)}>{t.l}</Button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : data?.summary ? (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(data.summary).map(([k, v]) => (
            <Card key={k} className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => navigate(getRouteForReportType(type))}>
              <div className="stat-card">
                <span className="stat-label">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="stat-value">{typeof v === 'number' ? v.toLocaleString() : v}</span>
                <p className="text-xs text-blue-500 mt-1">Click to view →</p>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {data?.rows?.length > 0 ? (
        <>
          <Card className="mb-4">
            <h3 className="font-bold mb-4 text-lg">{type.charAt(0).toUpperCase() + type.slice(1)} — Chart</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.rows.map(row => ({ name: String(Object.values(row)[0]).slice(0, 20), value: Object.values(row).find(v => typeof v === 'number') || 0 }))} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => v.toLocaleString()} />
                <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <h3 className="font-bold mb-4 text-lg">{type.charAt(0).toUpperCase() + type.slice(1)} Breakdown</h3>
            <div className="space-y-3">
              {data.rows.map((row, i) => {
                const label = Object.values(row)[0]
                const val = Object.values(row).find(v => typeof v === 'number') || 0
                const pct = Math.round((val / maxVal) * 100)
                return (
                  <div key={i} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{String(label)}</span>
                      <span className="text-slate-500">{typeof val === 'number' ? val.toLocaleString() : val}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: pct + '%', minWidth: pct > 0 ? '4px' : '0' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      ) : !loading ? (
        <ReportsEmptyState description="Select a report type, apply date filters, and click Generate to view data." />
      ) : null}

      <PageInfoPanel
        title="Reports"
        description="Generate, filter, and export HR reports across all modules"
        steps={[
          'Select a report type from the tab row (Attendance, Leave, Payroll, KPI, Recruitment, etc.).',
          'Set the date range using the From/To dropdowns, and optionally filter by Department.',
          'Click Generate to fetch and display the report data with a bar chart and breakdown table.',
          'Click Export CSV to download the raw data as a spreadsheet.',
          'Click Export PDF to generate a printable PDF report.',
        ]}
        faqs={[
          { q: 'Why does the report show no data?', a: 'Ensure the selected date range has activity. Try widening the date range or selecting All for department.' },
          { q: 'How do I filter by a specific employee?', a: 'Employee-level filtering is available on the individual module pages (Attendance, KPI, Payroll). Reports show department-level summaries.' },
          { q: 'PDF export opens a blank page?', a: 'Ensure the backend PDF endpoint is accessible and the VITE_API_URL environment variable is correctly set.' },
        ]}
        fetchStatus={async () => {
          const items = [];
          try {
            const checks = await Promise.allSettled([
              api.get('/reports/attendance').catch(() => ({ data: null })),
              api.get('/reports/payroll').catch(() => ({ data: null })),
            ]);
            const attOk = checks[0].status === 'fulfilled';
            const payOk = checks[1].status === 'fulfilled';
            if (!attOk) items.push({ level: 'warn', message: 'Attendance report endpoint is not responding', detail: 'Check backend connectivity.' });
            if (!payOk) items.push({ level: 'warn', message: 'Payroll report endpoint is not responding', detail: 'Check backend connectivity.' });
            if (items.length === 0) items.push({ level: 'success', message: 'All report endpoints are responding correctly.' });
          } catch { items.push({ level: 'info', message: 'Could not check report status. Ensure the backend is running.' }); }
          return items;
        }}
      />
    </div>
  )

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content
}