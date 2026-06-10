import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import DateDropdown from '../../components/common/DateDropdown'
import PageInfoPanel from '../../components/common/PageInfoPanel'
import { attendanceAPI } from '../../features/attendance/services/attendance.api'
import { employeeAPI } from '../../features/employees/services/employee.api'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { toast } from 'react-toastify'
import { BsPencil, BsClock } from 'react-icons/bs'
import { downloadPdfReport } from '../../utils/reportExport'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../../../components/ui/select'
// import './Attendance.css'

const Attendance = ({ role = 'employee', standalone = true }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { getShiftTypes } = useSettings()
  const shiftTypes = getShiftTypes()

  const isEmployee = role === 'employee'
  const canManageAttendance = role === 'admin' || role === 'manager'

  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPunchModal, setShowPunchModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [punchError, setPunchError] = useState('')
  const toLocalDateTimeInput = (date = new Date()) => {
    const d = new Date(date)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const [punchData, setPunchData] = useState({
    timestamp: toLocalDateTimeInput(),
    punchState: 'checkIn',
    employeeId: '',
  })
  const [adjustData, setAdjustData] = useState({
    id: '',
    attendanceDate: '',
    status: 'Present',
    shift: 'Morning',
    checkIn: '',
    breakOut: '',
    breakIn: '',
    checkOut: '',
  })
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [dateFilterState, setDateFilterState] = useState(null)
  const [attendanceDate, setAttendanceDate] = useState(null)
  const [biometricDeviceId, setBiometricDeviceId] = useState(localStorage.getItem('biometricDeviceId') || 'BIO-001')
  const [employees, setEmployees] = useState([])
  const [employeeProfile, setEmployeeProfile] = useState(null)
  const [sortField, setSortField] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')


  // Fetch employee profile for status and privacy
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!isEmployee) return
        const res = await employeeAPI.getMe()
        setEmployeeProfile(res.data)
      } catch {
        setEmployeeProfile(null)
      }
    }
    fetchProfile()
  }, [isEmployee, user?.userId, user?.id])

  useEffect(() => {
    if (canManageAttendance) {
      fetchEmployees()
      return
    }

    if (isEmployee && !employeeProfile?.id && !employeeProfile?._id) {
      return
    }

    fetchAttendance()
  }, [user?.id, user?.userId, role, isEmployee, employeeProfile?.id, employeeProfile?._id])

  useEffect(() => {
    if (canManageAttendance) {
      if (selectedEmployee) {
        fetchAttendance(selectedEmployee)
      } else {
        setAttendance([])
      }
    }
  }, [selectedEmployee])

  useEffect(() => {
    localStorage.setItem('biometricDeviceId', biometricDeviceId || '')
  }, [biometricDeviceId])

  const fetchEmployees = async () => {
    try {
      const res = await employeeAPI.getAll()
      const items = res.data || []
      setEmployees(items)

      if (items.length > 0 && !selectedEmployee) {
        setSelectedEmployee(String(items[0]._id || items[0].id))
      }
    } catch (err) {
      setEmployees([])
      toast.error('Failed to fetch employees')
    }
  }

  const fetchAttendance = async (empId) => {
    try {
      setLoading(true)

      const employeeId = canManageAttendance
        ? empId
        : (empId || employeeProfile?.id || employeeProfile?._id || user?.userId || user?.id)

      console.log('[fetchAttendance] employeeId:', employeeId, 'canManage:', canManageAttendance, 'profile:', employeeProfile?.id, 'user.id:', user?.id, 'user.userId:', user?.userId)

      if (!employeeId) {
        console.log('[fetchAttendance] No employeeId, returning empty')
        setAttendance([])
        return
      }

      const response = await attendanceAPI.getByEmployeeId(employeeId)
      console.log('[fetchAttendance] response:', response.status, 'records:', response.data?.length || 0, 'data:', JSON.stringify(response.data)?.slice(0, 200))
      setAttendance(response.data || [])
    } catch (error) {
      console.error('[fetchAttendance] Failed to fetch attendance:', error?.response?.status, error?.response?.data || error.message)
      toast.error('Failed to load attendance records')
    } finally {
      setLoading(false)
    }
  }

  const handleSelfPunch = async (state) => {
    try {
      // Get geolocation
      const getPosition = () =>
        new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject)
        );
      let geo = null;
      try {
        const pos = await getPosition();
        geo = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
      } catch (geoErr) {
        toast.error('Location required to log attendance');
        return;
      }

      await attendanceAPI.manualSelfPunch({
        biometricDeviceId,
        punchState: state,
        geolocation: geo,
      });
      toast.success('Attendance logged');
      fetchAttendance();
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Failed to log attendance');
    }
  } 

  const handleManagerPunch = async (e) => {
    e.preventDefault()
    setPunchError('')

    if (!punchData.employeeId) {
      setPunchError('Please select an employee')
      return
    }

    const payload = {
      ...punchData,
      employeeId: String(punchData.employeeId || ''),
    }
    console.log('[handleManagerPunch] sending payload:', JSON.stringify(payload))
    try {
      await attendanceAPI.managerManualPunch(payload)
      toast.success('Attendance recorded successfully')
      setShowPunchModal(false)
      setPunchData({
        timestamp: toLocalDateTimeInput(),
        punchState: 'checkIn',
        employeeId: selectedEmployee ? String(selectedEmployee) : '',
      })
      fetchAttendance(punchData.employeeId)
    } catch (error) {
      console.log('[handleManagerPunch] error:', error)
      console.log('[handleManagerPunch] error.response:', JSON.stringify(error?.response, null, 2))
      console.log('[handleManagerPunch] error.response.data:', JSON.stringify(error?.response?.data, null, 2))
      const errors = error?.response?.data?.errors || []
      const msg = errors.length > 0
        ? errors.join(', ')
        : error?.response?.data?.msg || error?.response?.data?.error || 'Failed to record attendance'
      console.log('[handleManagerPunch] displaying error:', msg)
      setPunchError(msg)
      toast.error(msg)
    }
  }

  const openAdjustmentModal = (row) => {
    const toLocalInput = (value) => {
      if (!value) return ''
      const date = new Date(value)
      const offset = date.getTimezoneOffset() * 60000
      return new Date(date.getTime() - offset).toISOString().slice(0, 16)
    }

    setAdjustData({
      id: row._id || row.id,
      attendanceDate: row.attendanceDate ? String(row.attendanceDate).slice(0, 10) : '',
      status: row.status || 'Present',
      shift: row.shift || 'Morning',
      checkIn: toLocalInput(row.checkIn),
      breakOut: toLocalInput(row.breakOut),
      breakIn: toLocalInput(row.breakIn),
      checkOut: toLocalInput(row.checkOut),
    })
    setAttendanceDate(row.attendanceDate ? new Date(row.attendanceDate) : null)
    setShowAdjustModal(true)
  }

  const handleAdjustmentSave = async (e) => {
    e.preventDefault()

    try {
      const payload = {
        attendanceDate: adjustData.attendanceDate || undefined,
        status: adjustData.status,
        shift: adjustData.shift,
        checkIn: adjustData.checkIn || undefined,
        breakOut: adjustData.breakOut || undefined,
        breakIn: adjustData.breakIn || undefined,
        checkOut: adjustData.checkOut || undefined,
      }

      await attendanceAPI.update(adjustData.id, payload)
      toast.success('Attendance updated successfully')
      setShowAdjustModal(false)
      fetchAttendance(selectedEmployee)
    } catch (error) {
      toast.error(error?.response?.data?.msg || 'Failed to adjust attendance')
    }
  }

  const formatTime = (time) => {
    if (!time) return '-'
    return new Date(time).toLocaleTimeString('en-US', { hour12: true })
  }

  const formatHours = (hours) => {
    if (!hours) return '-'
    return hours.toFixed(2) + ' hrs'
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredAttendance = attendance
    .filter((row) => {
      const dateText = row.attendanceDate ? new Date(row.attendanceDate).toLocaleDateString().toLowerCase() : ''
      const rowDateStr = row.attendanceDate ? String(row.attendanceDate).slice(0, 10) : ''
      const matchesSearch =
        !normalizedSearch ||
        dateText.includes(normalizedSearch) ||
        (row.status || '').toLowerCase().includes(normalizedSearch) ||
        (row.shift || '').toLowerCase().includes(normalizedSearch)
      const matchesStatus = statusFilter === 'all' || (row.status || '').toLowerCase() === statusFilter
      const matchesDate = !dateFilter || rowDateStr === dateFilter

      return matchesSearch && matchesStatus && matchesDate
    })
    .sort((a, b) => {
      let aVal, bVal
      if (sortField === 'date' || sortField === 'attendanceDate') {
        aVal = a.attendanceDate || ''
        bVal = b.attendanceDate || ''
        const comparison = new Date(aVal) - new Date(bVal)
        return sortDirection === 'asc' ? comparison : -comparison
      } else {
        aVal = a[sortField] || ''
        bVal = b[sortField] || ''
        const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
        return sortDirection === 'asc' ? comparison : -comparison
      }
    })

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleExportAttendanceReport = async () => {
    await downloadPdfReport({
      fileName: 'attendance-report.pdf',
      title: 'Attendance Report',
      rows: filteredAttendance,
      columns: [
        { label: 'Date', getValue: (row) => (row.attendanceDate ? new Date(row.attendanceDate).toLocaleDateString() : '') },
        { label: 'Status', getValue: (row) => row.status || '' },
        { label: 'Shift', getValue: (row) => row.shift || '' },
        { label: 'Check In', getValue: (row) => formatTime(row.checkIn) },
        { label: 'Check Out', getValue: (row) => formatTime(row.checkOut) },
        { label: 'Hours', getValue: (row) => formatHours(row.totalHoursWorked) },
      ],
      metadata: [
        { label: 'Status Filter', value: statusFilter === 'all' ? 'All' : statusFilter },
        { label: 'Scope', value: canManageAttendance ? 'Managed Employee' : 'Self' },
      ],
    })
  }

  const columns = [
    {
      key: 'attendanceDate',
      label: 'Date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    { key: 'status', label: 'Status' },
    { key: 'shift', label: 'Shift' },
    {
      key: 'checkIn',
      label: 'Check In',
      render: formatTime,
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      render: formatTime,
    },
    {
      key: 'totalHoursWorked',
      label: 'Hours',
      render: formatHours,
    },
    ...(canManageAttendance
      ? [
          {
            key: 'id',
            label: 'Actions',
            render: (_, row) => (
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => navigate(`/${role}/attendance/${row.id}`)}>View Details</Button>
                <button className="btn-icon edit" onClick={() => openAdjustmentModal(row)} title="Adjust Attendance">
                  <BsPencil size={16} />
                </button>
              </div>
            ),
          },
        ]
      : [{ key: 'id', label: 'Actions', render: (_, row) => (
          <Button size="sm" variant="primary" onClick={() => navigate(`/${role}/attendance/${row.id}`)}>View Details</Button>
        )}]),
  ]

  const content = (
    <div>
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">
          {isEmployee ? 'Daily logging and history' : 'Daily logging, history, and adjustment'}
        </p>
      </div>

      {canManageAttendance && (
        <Card>
          <div className="attendance-actions flex flex-wrap gap-3 items-center">
            <label className="font-medium">Employee</label>
            <select
              className="form-select"
              value={selectedEmployee}
              onChange={(e) => {
                setSelectedEmployee(e.target.value)
                setPunchData((prev) => ({ ...prev, employeeId: e.target.value }))
              }}
            >
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              onClick={() => {
                if (!selectedEmployee) {
                  toast.error('Select an employee first')
                  return
                }

                setPunchData((prev) => ({
                  ...prev,
                  employeeId: selectedEmployee,
                }))
                setShowPunchModal(true)
              }}
            >
              <BsClock size={18} />
              Log Daily Attendance
            </Button>
          </div>
        </Card>
      )}

      {isEmployee && employeeProfile && (
        <Card>
          <div className="mb-2 flex flex-wrap gap-4 items-center">
            <span className="font-semibold">Status:</span>
            <span className={`px-3 py-1 rounded-full text-white ${employeeProfile.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>{employeeProfile.status}</span>
          </div>
          {employeeProfile.status === 'active' && (
            <div className="attendance-actions flex flex-wrap gap-3 items-end">
              {/* Only show biometric input if user is the employee */}
              {user?.userId === employeeProfile.userId || user?.id === employeeProfile.userId ? (
                <Input
                  label="Biometric Device ID"
                  value={biometricDeviceId}
                  onChange={(e) => setBiometricDeviceId(e.target.value)}
                  placeholder="BIO-001"
                />
              ) : null}
              <Button variant="outline" onClick={() => handleSelfPunch('checkIn')}>
                Check In
              </Button>
              <Button variant="outline" onClick={() => handleSelfPunch('breakOut')}>
                Break Out
              </Button>
              <Button variant="outline" onClick={() => handleSelfPunch('breakIn')}>
                Break In
              </Button>
              <Button variant="primary" onClick={() => handleSelfPunch('checkOut')}>
                Check Out
              </Button>
            </div>
          )}
          {employeeProfile.status !== 'active' && (
            <div className="text-red-600 font-medium mt-2">You are not allowed to log attendance (status: {employeeProfile.status})</div>
          )}
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <Input
            label="Search"
            placeholder="Search by date, status, or shift"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-[240px]"
          />
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
            <DateDropdown 
                  selectedDate={dateFilterState}
                  onDateChange={(date) => {
                    setDateFilterState(date);
                    setDateFilter(date ? date.toISOString().split('T')[0] : '');
                  }}
                  label="Filter by Date"
                  showYear={true}
                  showMonth={true}
                  showDay={true}
                  yearRange={5}
                />
          </div>
          {dateFilter && (
            <button className="text-xs text-blue-500 underline mt-4" onClick={() => setDateFilter('')}>Clear date</button>
          )}
          <Button type="button" variant="outline" onClick={handleExportAttendanceReport}>Export Report</Button>
        </div>
        <Table columns={columns} data={filteredAttendance} loading={loading} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
      </Card>

      {canManageAttendance && (
        <Modal isOpen={showPunchModal} onClose={() => { setShowPunchModal(false); setPunchError('') }} title="Manager Manual Punch">
          <form onSubmit={handleManagerPunch} className="punch-form space-y-4">
            {punchError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {punchError}
              </div>
            )}
            <div className="form-group">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee</label>
              <Select
                value={punchData.employeeId}
                onValueChange={(val) => { setPunchData({ ...punchData, employeeId: val }); setPunchError('') }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp._id || emp.id} value={emp._id || emp.id}>
                      {emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Punch Type</label>
              <select
                value={punchData.punchState}
                onChange={(e) => setPunchData({ ...punchData, punchState: e.target.value })}
                className="form-select w-full"
              >
                <option value="checkIn">Check In</option>
                <option value="checkOut">Check Out</option>
              </select>
            </div>
            <Input
              label="Date & Time"
              type="datetime-local"
              value={punchData.timestamp}
              onChange={(e) => setPunchData({ ...punchData, timestamp: e.target.value })}
              required
            />
            <div className="form-actions flex gap-2 mt-4">
              <Button type="submit" variant="primary">
                Record Punch
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowPunchModal(false); setPunchError('') }}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {canManageAttendance && (
        <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} title="Adjust Attendance">
          <form onSubmit={handleAdjustmentSave} className="space-y-4">
            <div className="form-row">
              <DateDropdown
                selectedDate={attendanceDate}
                onDateChange={(date) => {
                  setAttendanceDate(date);
                  setAdjustData({ ...adjustData, attendanceDate: date ? date.toISOString().split('T')[0] : '' });
                }}
                label="Attendance Date"
                showYear={true}
                showMonth={true}
                showDay={true}
                yearRange={5}
              />
              <div className="form-group">
                <label>Status</label>
                <select
                  value={adjustData.status}
                  onChange={(e) => setAdjustData({ ...adjustData, status: e.target.value })}
                  className="form-select"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Shift</label>
              <select
                value={adjustData.shift}
                onChange={(e) => setAdjustData({ ...adjustData, shift: e.target.value })}
                className="form-select"
              >
                {shiftTypes.map(shift => (
                  <option key={shift} value={shift}>{shift}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <Input
                label="Check In"
                type="datetime-local"
                value={adjustData.checkIn}
                onChange={(e) => setAdjustData({ ...adjustData, checkIn: e.target.value })}
              />
              <Input
                label="Break Out"
                type="datetime-local"
                value={adjustData.breakOut}
                onChange={(e) => setAdjustData({ ...adjustData, breakOut: e.target.value })}
              />
            </div>

            <div className="form-row">
              <Input
                label="Break In"
                type="datetime-local"
                value={adjustData.breakIn}
                onChange={(e) => setAdjustData({ ...adjustData, breakIn: e.target.value })}
              />
              <Input
                label="Check Out"
                type="datetime-local"
                value={adjustData.checkOut}
                onChange={(e) => setAdjustData({ ...adjustData, checkOut: e.target.value })}
              />
            </div>

            <div className="form-actions flex gap-2 mt-4">
              <Button type="submit" variant="primary">
                Save Adjustment
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAdjustModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
      <PageInfoPanel
        title="Attendance"
        description="Track employee punch-in/out and work hours"
        steps={[
          'Employees can punch in/out using the Punch button (requires biometric device or manual entry).',
          'Managers can view all attendance records and adjust incorrect entries.',
          'Filter by date range or employee to find specific records.',
          'Export attendance reports as PDF for payroll processing.',
        ]}
        faqs={[
          { q: 'Why is an employee not showing in the list?', a: 'The employee may not be assigned to your department or has no attendance records.' },
          { q: 'Can I edit past attendance records?', a: 'Yes, as a manager you can adjust any attendance record. Changes are logged for audit purposes.' },
          { q: 'What does "Late" status mean?', a: 'The employee checked in after their scheduled shift start time.' },
          { q: 'How are work hours calculated?', a: 'Hours are calculated from check-in to check-out, minus break time if recorded.' },
        ]}
        fetchStatus={async () => {
          const items = [];
          try {
            const today = new Date().toISOString().split('T')[0];
            const [attRes, empRes] = await Promise.allSettled([
              api.get('/api/attendance').catch(() => ({ data: [] })),
              api.get('/api/employees').catch(() => ({ data: [] })),
            ]);
            const atts = attRes.status === 'fulfilled' ? (attRes.value.data || []) : [];
            const emps = empRes.status === 'fulfilled' ? (empRes.value.data || []) : [];
            const noPunchToday = emps.filter(e => !atts.some(a => a.employee_id === e.id && a.date === today));
            if (noPunchToday.length > 0) items.push({ level: 'warn', message: `${noPunchToday.length} employee${noPunchToday.length > 1 ? 's have' : ' has'} not punched in today`, detail: 'Check with employees or verify biometric device status.' });
            const lateToday = atts.filter(a => a.date === today && a.status === 'Late');
            if (lateToday.length > 0) items.push({ level: 'info', message: `${lateToday.length} late arrival${lateToday.length > 1 ? 's' : ''} today`, detail: 'Review late arrivals with the respective employees.' });
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const missingYesterday = emps.filter(e => !atts.some(a => a.employee_id === e.id && a.date === yesterday));
            if (missingYesterday.length > 0) items.push({ level: 'warn', message: `${missingYesterday.length} employee${missingYesterday.length > 1 ? 's are' : ' is'} missing yesterday\'s attendance`, detail: 'Follow up with employees to ensure records are complete.' });
            if (items.length === 0) items.push({ level: 'success', message: 'Attendance tracking is up to date — no issues found.' });
          } catch { items.push({ level: 'info', message: 'Could not retrieve attendance status. Ensure the backend is running.' }); }
          return items;
        }}
      />
    </div>
  )

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content
}

export default Attendance
