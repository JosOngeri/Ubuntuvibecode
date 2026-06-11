import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import {
  PayrollEmptyState,
  KpiEmptyState,
  LeaveEmptyState,
  RecruitmentEmptyState,
} from '../../components/common/EmptyState';
import { AttendanceEmptyState } from '../../features/attendance/components/EmptyState';
import { kpiAPI, complaintAPI } from '../../services/api';
import { jobApplicationAPI } from '../../features/recruitment/services/recruitment.api';
import { employeeAPI } from '../../features/employees/services/employee.api';
import { leaveAPI } from '../../features/leave/services/leave.api';
import { attendanceAPI } from '../../features/attendance/services/attendance.api';
import { payrollAPI } from '../../features/payroll/services/payroll.api';
import { toast } from 'react-toastify';
import {
  BsPerson,
  BsEnvelope,
  BsPhone,
  BsBriefcase,
  BsGeoAlt,
  BsClock,
  BsClipboardCheck,
  BsFileText,
  BsGraphUp,
  BsCalendarCheck,
  BsArrowLeft,
  BsBuilding,
  BsAward,
  BsExclamationCircle,
  BsFileEarmarkText,
  BsHouse,
  BsMortarboard,
  BsTools,
  BsCardText,
  BsPeople,
} from 'react-icons/bs';

const formatMoney = value =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(value || 0));

// Calendar Heatmap Component for Attendance
const AttendanceCalendar = ({ attendance, dateJoined }) => {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Get last 2 months
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Create attendance map for quick lookup
  const attendanceMap = {};
  attendance.forEach(record => {
    const date = new Date(record.attendanceDate);
    const key = date.toISOString().split('T')[0];
    attendanceMap[key] = record;
  });

  // Generate calendar days for a month
  const generateMonthDays = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const days = [];

    // Add empty cells for days before the 1st
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const record = attendanceMap[dateStr];

      // Determine if this is a future date or before employment
      const isFuture = date > today;
      const isBeforeEmployment = dateJoined && date < new Date(dateJoined);

      days.push({
        day,
        date: dateStr,
        record,
        isFuture,
        isBeforeEmployment,
      });
    }

    return days;
  };

  const getStatusColor = (record, isFuture, isBeforeEmployment) => {
    if (isFuture || isBeforeEmployment) return 'bg-slate-100';
    if (!record) return 'bg-slate-200';

    const status = record.status?.toLowerCase();
    switch (status) {
      case 'present':
        return 'bg-emerald-500';
      case 'late':
        return 'bg-amber-400';
      case 'absent':
        return 'bg-slate-300';
      case 'leave':
        return 'bg-rose-400';
      default:
        return 'bg-slate-200';
    }
  };

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderMonth = (year, month, monthName) => {
    const days = generateMonthDays(year, month);

    return (
      <div className="flex-1">
        <h4 className="text-lg font-semibold text-slate-900 mb-3 text-center">
          {monthName} {year}
        </h4>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs text-slate-500 font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((dayData, index) => (
            <div key={index} className="aspect-square">
              {dayData ? (
                <div
                  className={`w-full h-full rounded flex items-center justify-center text-sm font-medium cursor-pointer transition-all hover:scale-110 hover:ring-2 hover:ring-orange-400 ${getStatusColor(dayData.record, dayData.isFuture, dayData.isBeforeEmployment)} ${dayData.record ? 'text-white' : 'text-slate-600'}`}
                  onMouseEnter={() => setHoveredDay(dayData)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {dayData.day}
                </div>
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Calculate stats
  const calculateStats = () => {
    const allDays = [
      ...generateMonthDays(prevYear, prevMonth),
      ...generateMonthDays(currentYear, currentMonth),
    ].filter(d => d && !d.isFuture && !d.isBeforeEmployment);

    const total = allDays.length;
    const present = allDays.filter(d => d.record?.status?.toLowerCase() === 'present').length;
    const late = allDays.filter(d => d.record?.status?.toLowerCase() === 'late').length;
    const absent = allDays.filter(d => !d.record && !d.isFuture && !d.isBeforeEmployment).length;
    const onLeave = allDays.filter(d => d.record?.status?.toLowerCase() === 'leave').length;

    return {
      total,
      present,
      late,
      absent,
      onLeave,
      rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-sm text-slate-600">Total Days</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-emerald-600">{stats.present}</div>
          <div className="text-sm text-emerald-600">Present</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600">{stats.late}</div>
          <div className="text-sm text-amber-600">Late</div>
        </div>
        <div className="bg-rose-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-rose-600">{stats.onLeave}</div>
          <div className="text-sm text-rose-600">On Leave</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.rate}%</div>
          <div className="text-sm text-blue-600">Attendance Rate</div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {renderMonth(prevYear, prevMonth, monthNames[prevMonth])}
        {renderMonth(currentYear, currentMonth, monthNames[currentMonth])}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-sm text-slate-600">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-400" />
          <span className="text-sm text-slate-600">Late</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-rose-400" />
          <span className="text-sm text-slate-600">Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-300" />
          <span className="text-sm text-slate-600">Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-200" />
          <span className="text-sm text-slate-600">No Data</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && hoveredDay.record && (
        <div
          className="fixed z-50 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
          style={{ left: '50%', transform: 'translateX(-50%)', bottom: '20px' }}
        >
          <div className="font-semibold">
            {new Date(hoveredDay.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <div>
            Status: <span className="capitalize">{hoveredDay.record.status}</span>
          </div>
          {hoveredDay.record.checkIn && (
            <div>
              Check-in:{' '}
              {new Date(hoveredDay.record.checkIn).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
          {hoveredDay.record.checkOut && (
            <div>
              Check-out:{' '}
              {new Date(hoveredDay.record.checkOut).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
          {hoveredDay.record.totalHoursWorked && (
            <div>Hours: {hoveredDay.record.totalHoursWorked.toFixed(2)}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default function EmployeeProfile() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [attendance, setAttendance] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [jobApplication, setJobApplication] = useState(null);
  const [complaints, setComplaints] = useState({ asRespondent: [], asComplainant: [] });
  const [tabLoading, setTabLoading] = useState({});

  // Sorting states
  const [payslipSort, setPayslipSort] = useState({ field: 'period', direction: 'desc' });
  const [leaveSort, setLeaveSort] = useState({ field: 'startDate', direction: 'desc' });
  const [kpiSort, setKpiSort] = useState({ field: 'title', direction: 'asc' });
  const [complaintSort, setComplaintSort] = useState({ field: 'date', direction: 'desc' });

  useEffect(() => {
    fetchEmployee();
  }, [employeeId]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await employeeAPI.getById(employeeId);
      setEmployee(res.data);
    } catch (err) {
      toast.error('Failed to fetch employee details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data for active tab
  useEffect(() => {
    if (!employee) return;

    switch (activeTab) {
      case 'attendance':
        fetchAttendance();
        break;
      case 'payslips':
        fetchPayslips();
        break;
      case 'kpi':
        fetchKPIs();
        break;
      case 'leave':
        fetchLeaves();
        break;
      case 'jobApplication':
        fetchJobApplication();
        break;
      case 'complaints':
        fetchComplaints();
        break;
    }
  }, [activeTab, employee]);

  const fetchAttendance = async () => {
    try {
      setTabLoading(prev => ({ ...prev, attendance: true }));
      const res = await attendanceAPI.getByEmployeeId(employeeId);
      setAttendance(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch attendance');
    } finally {
      setTabLoading(prev => ({ ...prev, attendance: false }));
    }
  };

  const fetchPayslips = async () => {
    try {
      setTabLoading(prev => ({ ...prev, payslips: true }));
      const res = await payrollAPI.getPayslips();
      setPayslips((res.data || []).filter(p => p.employee_id === employeeId));
    } catch (err) {
      toast.error('Failed to fetch payslips');
    } finally {
      setTabLoading(prev => ({ ...prev, payslips: false }));
    }
  };

  const fetchKPIs = async () => {
    try {
      setTabLoading(prev => ({ ...prev, kpi: true }));
      const res = await kpiAPI.getEmployeeKPIs(employeeId);
      setKpis(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch KPIs');
    } finally {
      setTabLoading(prev => ({ ...prev, kpi: false }));
    }
  };

  const fetchLeaves = async () => {
    try {
      setTabLoading(prev => ({ ...prev, leave: true }));
      const res = await leaveAPI.getAll();
      setLeaves((res.data || []).filter(l => l.employee_id === employeeId));
    } catch (err) {
      toast.error('Failed to fetch leaves');
    } finally {
      setTabLoading(prev => ({ ...prev, leave: false }));
    }
  };

  const fetchJobApplication = async () => {
    try {
      setTabLoading(prev => ({ ...prev, jobApplication: true }));
      const res = await jobApplicationAPI.getByEmployeeId(employeeId);
      if (res.data && res.data.length > 0) {
        setJobApplication(res.data[0]);
      }
    } catch (err) {
      toast.error('Failed to fetch job application');
    } finally {
      setTabLoading(prev => ({ ...prev, jobApplication: false }));
    }
  };

  const fetchComplaints = async () => {
    try {
      setTabLoading(prev => ({ ...prev, complaints: true }));
      const res = await complaintAPI.getByEmployee(employeeId);
      setComplaints({
        asRespondent: res.data.complaintsAsRespondent || [],
        asComplainant: res.data.complaintsAsComplainant || [],
      });
    } catch (err) {
      toast.error('Failed to fetch complaints');
    } finally {
      setTabLoading(prev => ({ ...prev, complaints: false }));
    }
  };

  const handleSort = (section, field) => {
    const sortState =
      section === 'payslip'
        ? payslipSort
        : section === 'leave'
          ? leaveSort
          : section === 'kpi'
            ? kpiSort
            : complaintSort;

    const setSort =
      section === 'payslip'
        ? setPayslipSort
        : section === 'leave'
          ? setLeaveSort
          : section === 'kpi'
            ? setKpiSort
            : setComplaintSort;

    if (sortState.field === field) {
      setSort({ field, direction: sortState.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSort({ field, direction: 'asc' });
    }
  };

  const getSortedData = (section, data) => {
    const sortState =
      section === 'payslip'
        ? payslipSort
        : section === 'leave'
          ? leaveSort
          : section === 'kpi'
            ? kpiSort
            : complaintSort;

    return [...data].sort((a, b) => {
      let aVal, bVal;
      if (
        section === 'leave' &&
        (sortState.field === 'startDate' || sortState.field === 'endDate')
      ) {
        aVal = a[sortState.field] || a.start_date || a.end_date || '';
        bVal = b[sortState.field] || b.start_date || b.end_date || '';
        const comparison = new Date(aVal) - new Date(bVal);
        return sortState.direction === 'asc' ? comparison : -comparison;
      } else {
        aVal = a[sortState.field] || '';
        bVal = b[sortState.field] || '';
      }
      const comparison = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  };

  const attendanceColumns = [
    {
      key: 'attendanceDate',
      label: 'Date',
      sortable: true,
      render: date => new Date(date).toLocaleDateString(),
    },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'shift', label: 'Shift', sortable: true },
    {
      key: 'checkIn',
      label: 'Check In',
      sortable: true,
      render: time => (time ? new Date(time).toLocaleTimeString('en-US', { hour12: true }) : '-'),
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      sortable: true,
      render: time => (time ? new Date(time).toLocaleTimeString('en-US', { hour12: true }) : '-'),
    },
    {
      key: 'totalHoursWorked',
      label: 'Hours',
      sortable: true,
      render: hours => (hours ? hours.toFixed(2) + ' hrs' : '-'),
    },
  ];

  const payslipColumns = [
    { key: 'period', label: 'Period', sortable: true },
    { key: 'gross_pay', label: 'Gross Pay', sortable: true, render: val => formatMoney(val) },
    { key: 'net_pay', label: 'Net Pay', sortable: true, render: val => formatMoney(val) },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: status => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            status === 'Draft'
              ? 'bg-slate-200 text-slate-800'
              : status === 'Approved'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
          }`}
        >
          {status}
        </span>
      ),
    },
    { key: 'payment_method', label: 'Payment Method', sortable: true },
  ];

  const kpiColumns = [
    { key: 'definition_title', label: 'KPI Title', sortable: true },
    { key: 'period', label: 'Period', sortable: true },
    { key: 'target_value', label: 'Target', sortable: true },
    { key: 'achieved_value', label: 'Achieved', sortable: true },
    { key: 'final_score', label: 'Score', sortable: true, render: score => `${score}%` },
    { key: 'status', label: 'Status', sortable: true },
  ];

  const leaveColumns = [
    { key: 'type', label: 'Type', sortable: true },
    { key: 'start_date', label: 'Start Date', sortable: true },
    { key: 'end_date', label: 'End Date', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'reason', label: 'Reason', sortable: true },
  ];

  const complaintColumns = [
    { key: 'category', label: 'Category', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    {
      key: 'urgency',
      label: 'Urgency',
      sortable: true,
      render: urgency => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            urgency === 'critical'
              ? 'bg-red-100 text-red-800'
              : urgency === 'high'
                ? 'bg-orange-100 text-orange-800'
                : urgency === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-slate-100 text-slate-800'
          }`}
        >
          {urgency}
        </span>
      ),
    },
    { key: 'status', label: 'Status', sortable: true },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: date => new Date(date).toLocaleDateString(),
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BsPerson },
    { id: 'profile', label: 'Profile', icon: BsCardText },
    { id: 'work', label: 'Work History', icon: BsBriefcase },
    { id: 'attendance', label: 'Attendance', icon: BsClipboardCheck },
    { id: 'payslips', label: 'Payslips', icon: BsFileText },
    { id: 'leave', label: 'Leave', icon: BsCalendarCheck },
    { id: 'kpi', label: 'KPIs', icon: BsGraphUp },
    { id: 'jobApplication', label: 'Application', icon: BsFileEarmarkText },
    { id: 'complaints', label: 'Complaints', icon: BsExclamationCircle },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card>
            <p className="text-center text-slate-500">Employee not found</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <BsArrowLeft size={20} className="text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Employee Profile</h1>
          </div>
        </div>

        {/* Top Profile Section - Always Visible */}
        <Card>
          <div className="p-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
                {initials}
              </div>

              {/* Name and Badge */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900">{fullName}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-slate-600">{employee.department || 'N/A'}</span>
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-700">
                    {employee.employmentType || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stat Pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{attendance.length}</div>
                <div className="text-sm text-slate-600">Attendance Records</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{leaves.length}</div>
                <div className="text-sm text-slate-600">Leave Requests</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">
                  {kpis.length > 0
                    ? Math.round(
                        kpis.reduce((sum, k) => sum + (k.final_score || 0), 0) / kpis.length
                      )
                    : 0}
                  %
                </div>
                <div className="text-sm text-slate-600">Avg KPI Score</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">
                  {employee.wageRate
                    ? `KES ${parseFloat(employee.wageRate).toLocaleString()}`
                    : 'N/A'}
                </div>
                <div className="text-sm text-slate-600">Wage Rate</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <Card>
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-900">Quick Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm text-slate-600">Full Name</div>
                    <div className="text-lg font-semibold text-slate-900">{fullName}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm text-slate-600">Email</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {employee.email || 'N/A'}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm text-slate-600">Phone</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {employee.phone || 'N/A'}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm text-slate-600">Department</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {employee.department || 'N/A'}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm text-slate-600">Employment Type</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {employee.employmentType || 'N/A'}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm text-slate-600">Joined Date</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {employee.createdAt
                        ? new Date(employee.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-900">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-600">First Name</label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.firstName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Last Name</label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.lastName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <BsEnvelope size={14} /> Email
                    </label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <BsPhone size={14} /> Phone
                    </label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Date of Birth</label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.dateOfBirth
                        ? new Date(employee.dateOfBirth).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Gender</label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.gender || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Marital Status</label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.maritalStatus || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Nationality</label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.nationality || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">National ID</label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.nationalId || 'N/A'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <BsHouse size={14} /> Residential Address
                    </label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.residentialAddress
                        ? JSON.stringify(employee.residentialAddress)
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-600">Emergency Contact</label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.emergencyContact
                        ? JSON.stringify(employee.emergencyContact)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Work History Tab */}
            {activeTab === 'work' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-900">Work History</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Department</label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.department || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Employment Type</label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.employmentType || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Wage Rate</label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.wageRate
                        ? `KES ${parseFloat(employee.wageRate).toLocaleString()}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <BsClock size={14} /> Joined Date
                    </label>
                    <p className="text-lg font-semibold mt-1 text-slate-900">
                      {employee.createdAt
                        ? new Date(employee.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="pt-4">
                    <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <BsMortarboard size={18} /> Education History
                    </h4>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-600">
                        {employee.educationHistory
                          ? JSON.stringify(employee.educationHistory, null, 2)
                          : 'No education history recorded'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <BsTools size={18} /> Skills
                    </h4>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-600">
                        {employee.skills
                          ? JSON.stringify(employee.skills, null, 2)
                          : 'No skills recorded'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <BsAward size={18} /> Certifications
                    </h4>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-600">
                        {employee.certifications
                          ? JSON.stringify(employee.certifications, null, 2)
                          : 'No certifications recorded'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <BsBuilding size={18} /> Employment History
                    </h4>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-600">
                        {employee.employmentHistory
                          ? JSON.stringify(employee.employmentHistory, null, 2)
                          : 'No employment history recorded'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-900">Attendance Calendar</h3>
                {tabLoading.attendance ? (
                  <div className="text-center py-8">Loading attendance...</div>
                ) : (
                  <AttendanceCalendar
                    attendance={attendance}
                    dateJoined={employee.dateJoined || employee.createdAt}
                  />
                )}
              </div>
            )}

            {/* Payslips Tab */}
            {activeTab === 'payslips' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-900">Payslip History</h3>
                {tabLoading.payslips ? (
                  <div className="text-center py-8">Loading payslips...</div>
                ) : payslips.length === 0 ? (
                  <PayrollEmptyState />
                ) : (
                  <Table
                    columns={payslipColumns}
                    data={getSortedData('payslip', payslips)}
                    sortField={payslipSort.field}
                    sortDirection={payslipSort.direction}
                    onSort={field => handleSort('payslip', field)}
                  />
                )}
              </div>
            )}

            {/* Leave Tab */}
            {activeTab === 'leave' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-900">Leave History</h3>
                {tabLoading.leave ? (
                  <div className="text-center py-8">Loading leaves...</div>
                ) : leaves.length === 0 ? (
                  <LeaveEmptyState />
                ) : (
                  <Table
                    columns={leaveColumns}
                    data={getSortedData('leave', leaves)}
                    sortField={leaveSort.field}
                    sortDirection={leaveSort.direction}
                    onSort={field => handleSort('leave', field)}
                  />
                )}
              </div>
            )}

            {/* KPI Tab */}
            {activeTab === 'kpi' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-900">KPI Performance</h3>
                {tabLoading.kpi ? (
                  <div className="text-center py-8">Loading KPIs...</div>
                ) : kpis.length === 0 ? (
                  <KpiEmptyState />
                ) : (
                  <Table
                    columns={kpiColumns}
                    data={getSortedData('kpi', kpis)}
                    sortField={kpiSort.field}
                    sortDirection={kpiSort.direction}
                    onSort={field => handleSort('kpi', field)}
                  />
                )}
              </div>
            )}

            {/* Job Application Tab */}
            {activeTab === 'jobApplication' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-900">Job Application Details</h3>
                {tabLoading.jobApplication ? (
                  <div className="text-center py-8">Loading application...</div>
                ) : !jobApplication ? (
                  <RecruitmentEmptyState />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Application Date</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {jobApplication.appliedAt
                            ? new Date(jobApplication.appliedAt).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Status</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {jobApplication.status || 'N/A'}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Auto Score</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {jobApplication.autoScore || 'N/A'}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">Manual Score</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {jobApplication.manualScore || 'N/A'}
                        </div>
                      </div>
                    </div>
                    {jobApplication.personalInfo && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-2">Personal Information</h4>
                        <pre className="text-sm text-slate-600 whitespace-pre-wrap">
                          {JSON.stringify(jobApplication.personalInfo, null, 2)}
                        </pre>
                      </div>
                    )}
                    {jobApplication.education && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-2">Education</h4>
                        <pre className="text-sm text-slate-600 whitespace-pre-wrap">
                          {JSON.stringify(jobApplication.education, null, 2)}
                        </pre>
                      </div>
                    )}
                    {jobApplication.employmentHistory && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-2">Employment History</h4>
                        <pre className="text-sm text-slate-600 whitespace-pre-wrap">
                          {JSON.stringify(jobApplication.employmentHistory, null, 2)}
                        </pre>
                      </div>
                    )}
                    {jobApplication.skills && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-2">Skills</h4>
                        <pre className="text-sm text-slate-600 whitespace-pre-wrap">
                          {JSON.stringify(jobApplication.skills, null, 2)}
                        </pre>
                      </div>
                    )}
                    {jobApplication.cvPath && (
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600">CV Path</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {jobApplication.cvPath}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Complaints Tab */}
            {activeTab === 'complaints' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-900">Complaints</h3>
                {tabLoading.complaints ? (
                  <div className="text-center py-8">Loading complaints...</div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-slate-900 mb-3">
                        Complaints About Employee ({complaints.asRespondent.length})
                      </h4>
                      {complaints.asRespondent.length === 0 ? (
                        <div className="text-center py-4 text-slate-500">
                          No complaints about this employee
                        </div>
                      ) : (
                        <Table
                          columns={complaintColumns}
                          data={getSortedData('complaint', complaints.asRespondent)}
                          sortField={complaintSort.field}
                          sortDirection={complaintSort.direction}
                          onSort={field => handleSort('complaint', field)}
                        />
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-3">
                        Complaints by Employee ({complaints.asComplainant.length})
                      </h4>
                      {complaints.asComplainant.length === 0 ? (
                        <div className="text-center py-4 text-slate-500">
                          No complaints submitted by this employee
                        </div>
                      ) : (
                        <Table
                          columns={complaintColumns}
                          data={getSortedData('complaint', complaints.asComplainant)}
                          sortField={complaintSort.field}
                          sortDirection={complaintSort.direction}
                          onSort={field => handleSort('complaint', field)}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
