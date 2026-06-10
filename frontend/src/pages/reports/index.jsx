import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import DateDropdown from '../../components/common/DateDropdown';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { BsDownload } from 'react-icons/bs';
import PageInfoPanel from '../../components/common/PageInfoPanel';
import { ReportsEmptyState } from '../../components/common/EmptyState';

const REPORT_TYPES = [
  { k: 'attendance', l: 'Attendance' },
  { k: 'leave', l: 'Leave' },
  { k: 'payroll', l: 'Payroll' },
  { k: 'kpi', l: 'KPI' },
  { k: 'employee', l: 'Employees' },
  { k: 'recruitment', l: 'Recruitment' },
  { k: 'complaints', l: 'Complaints' },
  { k: 'daily-labour', l: 'Daily Labour' },
];

export default function ReportsPage({ standalone = true }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getDepartments } = useSettings();
  const [type, setType] = useState('attendance');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState({ from: '', to: '' });
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [dept, setDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Handle tab query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && REPORT_TYPES.find(t => t.k === tabParam)) {
      setType(tabParam);
    }
  }, []);

  const getRouteForReportType = reportType => {
    const role = user?.role || 'admin';
    const routes = {
      attendance:
        role === 'admin'
          ? '/admin/attendance'
          : role === 'manager' || role === 'supervisor'
            ? '/manager/attendance'
            : '/employee/attendance',
      leave:
        role === 'admin'
          ? '/admin/leaves'
          : role === 'manager' || role === 'supervisor'
            ? '/manager/leaves'
            : '/employee/leaves',
      payroll: role === 'admin' ? '/admin/payroll' : '/payroll/disburse',
      kpi: role === 'admin' ? '/admin/kpis' : '/kpi/manage',
      employee: '/admin/employees',
      recruitment: '/recruitment/jobs',
      complaints: '/admin/complaints',
      'daily-labour': '/admin/daily-labour',
    };
    return routes[reportType] || '/';
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (range.from) params.from = range.from;
      if (range.to) params.to = range.to;
      if (dept !== 'all') params.department = dept;
      const r = await api.get('/reports/' + type, { params }).catch(() => ({ data: null }));
      setData(r.data);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  const getRecords = () => {
    let records = data?.records || [];

    // Apply status filter based on report type
    if (filterStatus !== 'all') {
      if (type === 'attendance') {
        records = records.filter(r => r.status?.toLowerCase() === filterStatus.toLowerCase());
      } else if (type === 'leave') {
        records = records.filter(r => r.status?.toLowerCase() === filterStatus.toLowerCase());
      } else if (type === 'payroll') {
        records = records.filter(r => r.status?.toLowerCase() === filterStatus.toLowerCase());
      } else if (type === 'kpi') {
        records = records.filter(r => r.status?.toLowerCase() === filterStatus.toLowerCase());
      } else if (type === 'recruitment') {
        records = records.filter(r => r.status?.toLowerCase() === filterStatus.toLowerCase());
      } else if (type === 'complaints') {
        records = records.filter(r => r.status?.toLowerCase() === filterStatus.toLowerCase());
      } else if (type === 'daily-labour') {
        records = records.filter(r => r.status?.toLowerCase() === filterStatus.toLowerCase());
      }
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      records = records.filter(r => {
        const empName = getEmployeeName(r).toLowerCase();
        return empName.includes(term) || Object.values(r).some(v =>
          String(v).toLowerCase().includes(term)
        );
      });
    }

    // Apply sorting
    if (sortColumn) {
      records = [...records].sort((a, b) => {
        let aVal = sortColumn === 'employee_name' ? getEmployeeName(a) : a[sortColumn];
        let bVal = sortColumn === 'employee_name' ? getEmployeeName(b) : b[sortColumn];

        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return records;
  };

  const getDynamicSummary = () => {
    const records = data?.records || [];
    
    if (type === 'attendance') {
      const total = records.length;
      const present = records.filter(r => r.status?.toLowerCase() === 'present').length;
      const absent = records.filter(r => r.status?.toLowerCase() === 'absent').length;
      const late = records.filter(r => r.status?.toLowerCase() === 'late').length;
      const halfDay = records.filter(r => r.status?.toLowerCase() === 'half day').length;
      
      return [
        { key: 'total', label: 'Total Records', value: total },
        { key: 'present', label: 'Present', value: present },
        { key: 'absent', label: 'Absent', value: absent },
        { key: 'late', label: 'Late', value: late },
        { key: 'half day', label: 'Half Day', value: halfDay },
      ];
    }
    
    if (type === 'leave') {
      const total = records.length;
      const pending = records.filter(r => r.status?.toLowerCase() === 'pending').length;
      const approved = records.filter(r => r.status?.toLowerCase() === 'approved').length;
      const rejected = records.filter(r => r.status?.toLowerCase() === 'rejected').length;
      
      return [
        { key: 'total', label: 'Total Records', value: total },
        { key: 'pending', label: 'Pending', value: pending },
        { key: 'approved', label: 'Approved', value: approved },
        { key: 'rejected', label: 'Rejected', value: rejected },
      ];
    }
    
    if (type === 'payroll') {
      const total = records.length;
      const draft = records.filter(r => r.status?.toLowerCase() === 'draft').length;
      const pending = records.filter(r => r.status?.toLowerCase() === 'pending').length;
      const approved = records.filter(r => r.status?.toLowerCase() === 'approved').length;
      const paid = records.filter(r => r.status?.toLowerCase() === 'paid').length;
      
      return [
        { key: 'total', label: 'Total Records', value: total },
        { key: 'draft', label: 'Draft', value: draft },
        { key: 'pending', label: 'Pending', value: pending },
        { key: 'approved', label: 'Approved', value: approved },
        { key: 'paid', label: 'Paid', value: paid },
      ];
    }
    
    if (type === 'kpi') {
      const total = records.length;
      const pending = records.filter(r => r.status?.toLowerCase() === 'pending').length;
      const inProgress = records.filter(r => r.status?.toLowerCase() === 'in progress').length;
      const completed = records.filter(r => r.status?.toLowerCase() === 'completed').length;
      
      return [
        { key: 'total', label: 'Total Records', value: total },
        { key: 'pending', label: 'Pending', value: pending },
        { key: 'in progress', label: 'In Progress', value: inProgress },
        { key: 'completed', label: 'Completed', value: completed },
      ];
    }
    
    if (type === 'recruitment') {
      const total = records.length;
      const pending = records.filter(r => r.status?.toLowerCase() === 'pending').length;
      const underReview = records.filter(r => r.status?.toLowerCase() === 'under review').length;
      const interviewScheduled = records.filter(r => r.status?.toLowerCase() === 'interview scheduled').length;
      const offered = records.filter(r => r.status?.toLowerCase() === 'offered').length;
      const hired = records.filter(r => r.status?.toLowerCase() === 'hired').length;
      const rejected = records.filter(r => r.status?.toLowerCase() === 'rejected').length;
      
      return [
        { key: 'total', label: 'Total Records', value: total },
        { key: 'pending', label: 'Pending', value: pending },
        { key: 'under review', label: 'Under Review', value: underReview },
        { key: 'interview scheduled', label: 'Interview Scheduled', value: interviewScheduled },
        { key: 'offered', label: 'Offered', value: offered },
        { key: 'hired', label: 'Hired', value: hired },
        { key: 'rejected', label: 'Rejected', value: rejected },
      ];
    }
    
    if (type === 'complaints') {
      const total = records.length;
      const pending = records.filter(r => r.status?.toLowerCase() === 'pending').length;
      const inProgress = records.filter(r => r.status?.toLowerCase() === 'in progress').length;
      const resolved = records.filter(r => r.status?.toLowerCase() === 'resolved').length;
      
      return [
        { key: 'total', label: 'Total Records', value: total },
        { key: 'pending', label: 'Pending', value: pending },
        { key: 'in progress', label: 'In Progress', value: inProgress },
        { key: 'resolved', label: 'Resolved', value: resolved },
      ];
    }
    
    if (type === 'daily-labour') {
      const total = records.length;
      const present = records.filter(r => r.status?.toLowerCase() === 'present').length;
      const absent = records.filter(r => r.status?.toLowerCase() === 'absent').length;
      const late = records.filter(r => r.status?.toLowerCase() === 'late').length;
      
      return [
        { key: 'total', label: 'Total Records', value: total },
        { key: 'present', label: 'Present', value: present },
        { key: 'absent', label: 'Absent', value: absent },
        { key: 'late', label: 'Late', value: late },
      ];
    }
    
    // Default summary for employee type
    if (type === 'employee') {
      const total = records.length;
      const active = records.filter(r => r.status?.toLowerCase() === 'active').length;
      const inactive = records.filter(r => r.status?.toLowerCase() === 'inactive').length;
      
      return [
        { key: 'total', label: 'Total Records', value: total },
        { key: 'active', label: 'Active', value: active },
        { key: 'inactive', label: 'Inactive', value: inactive },
      ];
    }
    
    return [];
  };

  const TYPE_COLUMNS = {
    attendance: [
      'attendance_date',
      'status',
      'shift',
      'check_in',
      'check_out',
      'total_hours_worked',
    ],
    leave: ['type', 'start_date', 'end_date', 'days_requested', 'status', 'reason'],
    payroll: ['period', 'gross_pay', 'net_pay', 'deductions', 'status', 'payment_method'],
    kpi: ['definition_title', 'target_score', 'final_score', 'status', 'created_at'],
    employee: [
      'first_name',
      'last_name',
      'department',
      'position',
      'employment_type',
      'status',
      'created_at',
    ],
    recruitment: ['applicant_name', 'job_title', 'status', 'owner_status', 'created_at'],
    complaints: [
      'type',
      'category',
      'urgency',
      'status',
      'department',
      'submitted_by_display',
      'created_at',
    ],
    'daily-labour': [
      'labourer_name',
      'date',
      'status',
      'check_in',
      'check_out',
      'daily_rate',
      'wage_earned',
    ],
  };

  const getRecordColumns = () => {
    const records = getRecords();
    if (!records.length) return [];
    const typeCols = TYPE_COLUMNS[type] || [];
    const sampleKeys = Object.keys(records[0]).filter(
      k =>
        ![
          'id',
          'employee_id',
          'labourer_id',
          'job_id',
          'jobid',
          'definition_id',
          'punch_history',
          'check_in_lat',
          'check_in_lng',
          'check_out_lat',
          'check_out_lng',
          'updated_at',
          'password',
          'employee',
          'employeeId',
          'first_name',
          'last_name',
          'labourer_name',
        ].includes(k) && typeof records[0][k] !== 'object'
    );
    return [
      ...new Set([
        ...typeCols.filter(k => sampleKeys.includes(k) || k === 'labourer_name'),
        ...sampleKeys,
      ]),
    ].slice(0, 9);
  };

  const formatCellValue = (key, val) => {
    if (val === null || val === undefined || val === '') return '-';
    if (key.includes('date') || key === 'created_at' || key === 'updated_at') {
      const d = new Date(val);
      return isNaN(d) ? val : d.toLocaleDateString();
    }
    if (key.includes('time') || key === 'check_in' || key === 'check_out') {
      const d = new Date(val);
      return isNaN(d) ? val : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (
      [
        'amount',
        'total_hours_worked',
        'daily_rate',
        'gross_pay',
        'net_pay',
        'deductions',
        'wage_earned',
        'wage_for_day',
        'target_score',
        'final_score',
      ].includes(key)
    )
      return Number(val).toLocaleString();
    return String(val);
  };

  const getEmployeeName = record => {
    if (type === 'recruitment') return record.applicant_name || record.applicantname || '';
    if (type === 'complaints') return record.submitted_by_display || record.guest_name || '';
    if (type === 'daily-labour')
      return record.labourer_name || `${record.first_name || ''} ${record.last_name || ''}`.trim();
    if (record.first_name) return `${record.first_name} ${record.last_name || ''}`.trim();
    if (record.employee?.firstName)
      return `${record.employee.firstName} ${record.employee.lastName || ''}`.trim();
    if (record.employeeId?.firstName)
      return `${record.employeeId.firstName} ${record.employeeId.lastName || ''}`.trim();
    return '';
  };

  const exportCSV = () => {
    const records = getRecords();
    if (!records.length) return;
    const headers = Object.keys(records[0])
      .filter(k => typeof records[0][k] !== 'object')
      .join(',');
    const rows = records
      .map(r =>
        Object.entries(r)
          .filter(([, v]) => typeof v !== 'object')
          .map(([, v]) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type + '-report.csv';
    a.click();
  };

  const exportPDF = async () => {
    try {
      const params = {};
      if (range.from) params.from = range.from;
      if (range.to) params.to = range.to;
      if (dept !== 'all') params.department = dept;
      params.type = type;

      const url = new URL(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports/pdf`
      );
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

      window.open(url.toString(), '_blank');
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

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
              onDateChange={date => {
                setFromDate(date);
                setRange({ ...range, from: date ? date.toISOString().split('T')[0] : '' });
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
              onDateChange={date => {
                setToDate(date);
                setRange({ ...range, to: date ? date.toISOString().split('T')[0] : '' });
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
            <select
              className="form-select text-sm"
              value={dept}
              onChange={e => setDept(e.target.value)}
            >
              <option value="all">All</option>
              {getDepartments().map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <Button variant="primary" size="sm" onClick={fetchReport}>
            Generate
          </Button>
          {getRecords().length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <BsDownload className="mr-1" />
              Export CSV
            </Button>
          )}
          {getRecords().length > 0 && (
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <BsDownload className="mr-1" />
              Export PDF
            </Button>
          )}
        </div>
      </Card>

      <div className="flex gap-2 mb-4 flex-wrap">
        {REPORT_TYPES.map(t => (
          <Button
            key={t.k}
            variant={type === t.k ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setType(t.k)}
          >
            {t.l}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {getDynamicSummary().map((item) => (
            <Card
              key={item.key}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => {
                if (item.key === 'total') {
                  setFilterStatus('all');
                } else {
                  setFilterStatus(item.key);
                }
              }}
            >
              <div className="stat-card">
                <span className="stat-label">{item.label}</span>
                <span className="stat-value">{item.value.toLocaleString()}</span>
                <p className="text-xs text-blue-500 mt-1">Click to filter →</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {getRecords().length > 0 ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">
              {type.charAt(0).toUpperCase() + type.slice(1)} Records ({getRecords().length})
            </h3>
            <div className="flex gap-2">
              {type === 'attendance' && (
                <select
                  className="form-select text-sm"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half day">Half Day</option>
                </select>
              )}
              {type === 'leave' && (
                <select
                  className="form-select text-sm"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              )}
              {type === 'payroll' && (
                <select
                  className="form-select text-sm"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
              )}
              {type === 'kpi' && (
                <select
                  className="form-select text-sm"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              )}
              {type === 'recruitment' && (
                <select
                  className="form-select text-sm"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="under review">Under Review</option>
                  <option value="interview scheduled">Interview Scheduled</option>
                  <option value="offered">Offered</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
              )}
              {type === 'complaints' && (
                <select
                  className="form-select text-sm"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              )}
              {type === 'daily-labour' && (
                <select
                  className="form-select text-sm"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="no work">No Work</option>
                </select>
              )}
              <input
                type="text"
                placeholder="Search..."
                className="form-input text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th
                    className="text-left py-2 px-3 font-semibold text-slate-600 whitespace-nowrap cursor-pointer hover:text-blue-600"
                    onClick={() => {
                      if (sortColumn === 'employee_name') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortColumn('employee_name');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    {type === 'recruitment'
                      ? 'Applicant'
                      : type === 'complaints'
                        ? 'Reported By'
                        : type === 'daily-labour'
                          ? 'Labourer'
                          : 'Employee'}
                    {sortColumn === 'employee_name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  {getRecordColumns()
                    .filter(
                      k =>
                        ![
                          'first_name',
                          'last_name',
                          'name',
                          'labourer_name',
                          'applicant_name',
                          'applicantname',
                          'submitted_by_display',
                        ].includes(k)
                    )
                    .map(col => (
                      <th
                        key={col}
                        className="text-left py-2 px-3 font-semibold text-slate-600 whitespace-nowrap cursor-pointer hover:text-blue-600"
                        onClick={() => {
                          if (sortColumn === col) {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortColumn(col);
                            setSortDirection('asc');
                          }
                        }}
                      >
                        {col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        {sortColumn === col && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {getRecords().map((record, i) => {
                  const empName = getEmployeeName(record);
                  const cols = getRecordColumns().filter(
                    k =>
                      ![
                        'first_name',
                        'last_name',
                        'name',
                        'labourer_name',
                        'applicant_name',
                        'applicantname',
                        'submitted_by_display',
                      ].includes(k)
                  );
                  return (
                    <tr
                      key={i}
                      className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="py-2 px-3 font-medium text-slate-700 whitespace-nowrap">
                        {empName || '-'}
                      </td>
                      {cols.map(col => (
                        <td key={col} className="py-2 px-3 text-slate-600 whitespace-nowrap">
                          {formatCellValue(col, record[col])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : !loading ? (
        <ReportsEmptyState description="No data found. Try adjusting the date range or filters, then click Generate." />
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
          {
            q: 'Why does the report show no data?',
            a: 'Ensure the selected date range has activity. Try widening the date range or selecting All for department.',
          },
          {
            q: 'How do I filter by a specific employee?',
            a: 'Employee-level filtering is available on the individual module pages (Attendance, KPI, Payroll). Reports show department-level summaries.',
          },
          {
            q: 'PDF export opens a blank page?',
            a: 'Ensure the backend PDF endpoint is accessible and the VITE_API_URL environment variable is correctly set.',
          },
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
            if (!attOk)
              items.push({
                level: 'warn',
                message: 'Attendance report endpoint is not responding',
                detail: 'Check backend connectivity.',
              });
            if (!payOk)
              items.push({
                level: 'warn',
                message: 'Payroll report endpoint is not responding',
                detail: 'Check backend connectivity.',
              });
            if (items.length === 0)
              items.push({
                level: 'success',
                message: 'All report endpoints are responding correctly.',
              });
          } catch {
            items.push({
              level: 'info',
              message: 'Could not check report status. Ensure the backend is running.',
            });
          }
          return items;
        }}
      />
    </div>
  );

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content;
}
