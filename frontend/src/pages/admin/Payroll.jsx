import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import DateDropdown from '../../components/common/DateDropdown';
import api, { employeeAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { BsCash, BsCalendarWeek, BsPeople, BsClock, BsCheckCircle, BsHourglass, BsXCircle, BsChevronDown, BsChevronUp, BsFileText, BsGraphUp } from 'react-icons/bs';
import PageInfoPanel from '../../components/common/PageInfoPanel';
import { PayrollEmptyState } from '../../components/common/EmptyState';

const formatMoney = (value) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(value || 0))

export default function Payroll({ standalone = true }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ employeeId: '', period: new Date().toISOString().slice(0, 7) });
  const [activeTab, setActiveTab] = useState('draft');
  const [showDailyOnly, setShowDailyOnly] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // Helper functions for time grouping
  const getTimeGroup = (date) => {
    if (!date) return 'older';
    const now = new Date();
    const itemDate = new Date(date);
    const diffTime = now - itemDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays <= 7) return 'lastWeek';
    if (diffDays <= 30) return 'lastMonth';
    return 'older';
  };

  const groupPayslipsByTime = (payslipsList) => {
    const groups = {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: []
    };
    
    payslipsList.forEach(payslip => {
      const group = getTimeGroup(payslip.created_at);
      groups[group].push(payslip);
    });
    
    return groups;
  };

  const toggleCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getEmployeeById = (id) => employees.find(emp => emp.id === id || emp._id === id);

  const isDailyWorker = (payslip) => {
    const emp = getEmployeeById(payslip.employee_id);
    return emp?.employment_type === 'Daily' || emp?.employment_type === 'Daily Worker';
  };

  const calculateStats = useMemo(() => {
    const draftCount = payslips.filter(p => p.status === 'Draft').length;
    const approvedCount = payslips.filter(p => p.status === 'Approved').length;
    const paidCount = payslips.filter(p => p.status === 'Paid').length;
    const failedCount = payslips.filter(p => p.status === 'Failed').length;
    const dailyWorkersCount = employees.filter(e => e.employment_type === 'Daily' || e.employment_type === 'Daily Worker').length;
    const monthlyEmployeesCount = employees.filter(e => e.employment_type === 'Monthly' || e.employment_type === 'Permanent').length;
    
    const now = new Date();
    const thisMonth = payslips.filter(p => {
      const date = new Date(p.created_at);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && p.status === 'Paid';
    });
    const paidThisMonth = thisMonth.reduce((sum, p) => sum + (p.net_pay || 0), 0);
    
    return {
      draftCount,
      approvedCount,
      paidCount,
      failedCount,
      dailyWorkersCount,
      monthlyEmployeesCount,
      paidThisMonth,
      totalPayroll: payslips.reduce((sum, p) => sum + (p.net_pay || 0), 0)
    };
  }, [payslips, employees]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, payRes] = await Promise.all([
        employeeAPI.getAll().catch(() => ({ data: [] })),
        api.get('/api/payroll').catch(() => ({ data: [] }))
      ]);
      setEmployees(empRes.data || []);
      setPayslips(payRes.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.period) return toast.error('Employee and Period are required');
    try {
      setGenerating(true);
      await api.post('/api/payroll/calculate', form);
      toast.success('Draft payslip generated successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate payslip');
    } finally {
      setGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    const period = new Date().toISOString().slice(0, 7);
    if (!confirm(`Generate draft payslips for all monthly employees for period ${period}?`)) return;
    try {
      setGenerating(true);
      const res = await api.post('/api/payroll/batch-generate', { period });
      toast.success(`Generated ${res.data.generated} draft payslips, skipped ${res.data.skipped}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Batch generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/payroll/approve/${id}`);
      toast.success('Payslip approved for disbursement');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve payslip');
    }
  };

  const handleBatchApprove = async () => {
    const draftPayslips = payslips.filter(p => p.status === 'Draft');
    if (draftPayslips.length === 0) return toast.info('No draft payslips to approve');
    if (!confirm(`Approve ${draftPayslips.length} draft payslips for disbursement?`)) return;
    
    try {
      setGenerating(true);
      await Promise.all(draftPayslips.map(p => api.put(`/api/payroll/approve/${p.id}`)));
      toast.success(`Approved ${draftPayslips.length} payslips`);
      loadData();
    } catch (err) {
      toast.error('Some approvals failed');
    } finally {
      setGenerating(false);
    }
  };

  const tabs = [
    { id: 'draft', label: 'Draft', icon: BsHourglass, count: calculateStats.draftCount },
    { id: 'approved', label: 'Approved', icon: BsCheckCircle, count: calculateStats.approvedCount },
    { id: 'paid', label: 'Paid', icon: BsCash, count: calculateStats.paidCount },
    { id: 'failed', label: 'Failed', icon: BsXCircle, count: calculateStats.failedCount },
  ];

  const filteredPayslips = useMemo(() => {
    let filtered = payslips.filter(p => {
      const statusMatch = p.status.toLowerCase() === activeTab;
      const dailyMatch = showDailyOnly ? isDailyWorker(p) : true;
      return statusMatch && dailyMatch;
    });
    return filtered;
  }, [payslips, activeTab, showDailyOnly, employees]);

  const groupedPayslips = useMemo(() => {
    return groupPayslipsByTime(filteredPayslips);
  }, [filteredPayslips]);

  const timeGroupLabels = {
    today: 'Today',
    yesterday: 'Yesterday',
    lastWeek: 'Last Week',
    lastMonth: 'Last Month',
    older: 'Older'
  };

  const PayslipCard = ({ payslip }) => {
    const emp = getEmployeeById(payslip.employee_id);
    const isExpanded = expandedCards[payslip.id];
    const isDaily = isDailyWorker(payslip);

    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div 
          className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleCard(payslip.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center text-sm font-bold">
                {emp ? `${emp.first_name?.[0]}${emp.last_name?.[0]}`.toUpperCase() : '??'}
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown Employee'}
                </div>
                <div className="text-sm text-slate-500">
                  {payslip.period} • {isDaily ? 'Daily Worker' : 'Monthly Employee'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-bold text-lg text-slate-900">{formatMoney(payslip.net_pay)}</div>
                <div className="text-xs text-slate-500">Net Pay</div>
              </div>
              <BsChevronDown className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-500">Gross Pay</div>
                <div className="font-semibold text-slate-900">{formatMoney(payslip.gross_pay)}</div>
              </div>
              <div>
                <div className="text-slate-500">Overtime Pay</div>
                <div className="font-semibold text-slate-900">{formatMoney(payslip.overtime_pay)}</div>
              </div>
              <div>
                <div className="text-slate-500">KPI Bonus</div>
                <div className="font-semibold text-slate-900">{formatMoney(payslip.kpi_bonus)}</div>
              </div>
              <div>
                <div className="text-slate-500">Deductions</div>
                <div className="font-semibold text-rose-600">{formatMoney(payslip.deductions)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-slate-500">Payment Method</div>
                <div className="font-semibold text-slate-900">{payslip.payment_method}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {payslip.status === 'Draft' && (
                <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); handleApprove(payslip.id); }}>
                  Approve
                </Button>
              )}
              {payslip.status === 'Approved' && (
                <Button size="sm" variant="primary" onClick={() => navigate('/payroll/disburse')}>
                  Disburse
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const TimeGroupSection = ({ group, label }) => {
    const payslipsInGroup = groupedPayslips[group];
    const isExpanded = expandedGroups[group];
    
    if (payslipsInGroup.length === 0) return null;
    
    return (
      <div className="mb-6">
        <div 
          className="flex items-center gap-2 mb-3 cursor-pointer"
          onClick={() => toggleGroup(group)}
        >
          <BsChevronDown className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          <h3 className="font-semibold text-slate-900">{label} ({payslipsInGroup.length})</h3>
        </div>
        {isExpanded && (
          <div className="space-y-3">
            {payslipsInGroup.map(payslip => (
              <PayslipCard key={payslip.id} payslip={payslip} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const content = (
    <div>
      <div className="page-header mb-6">
        <h1 className="page-title">Payroll Management</h1>
        <p className="page-subtitle">Calculate, approve, and manage payroll for all employees.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <BsHourglass size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{calculateStats.draftCount}</div>
              <div className="text-sm text-slate-500">Pending Approval</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <BsCheckCircle size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{calculateStats.approvedCount}</div>
              <div className="text-sm text-slate-500">Approved</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <BsCash size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{calculateStats.paidCount}</div>
              <div className="text-sm text-slate-500">Paid</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <BsXCircle size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{calculateStats.failedCount}</div>
              <div className="text-sm text-slate-500">Failed</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <BsPeople size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{calculateStats.dailyWorkersCount}</div>
              <div className="text-sm text-slate-500">Daily Workers</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <BsGraphUp size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatMoney(calculateStats.paidThisMonth)}</div>
              <div className="text-sm text-slate-500">Paid This Month</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel - Calculate */}
        <Card className="xl:col-span-1 h-fit">
          <h2 className="text-lg font-bold mb-4">Calculate Payslip</h2>
          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Employee</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.employeeId} 
                onChange={e => setForm({...form, employeeId: e.target.value})} 
                required
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employment_type})
                  </option>
                ))}
              </select>
            </div>
            <Input label="Period (YYYY-MM)" type="month" value={form.period} onChange={e => setForm({...form, period: e.target.value})} required />
            <Button type="submit" variant="primary" className="w-full" loading={generating}>
              Generate Draft
            </Button>
          </form>
          
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button variant="secondary" onClick={handleBatchGenerate} loading={generating} className="w-full mb-2">
              Batch Generate (Monthly)
            </Button>
            {activeTab === 'draft' && (
              <Button variant="success" onClick={handleBatchApprove} loading={generating} className="w-full">
                Batch Approve All
              </Button>
            )}
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300">
            <strong>Calculation:</strong> Base rate × Hours worked + Overtime + KPI Bonus - Deductions = Net Pay
          </div>
        </Card>

        {/* Right Panel - Payslips */}
        <Card className="xl:col-span-2">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4 overflow-x-auto">
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
                  {tab.count > 0 && <span className="px-2 py-0.5 bg-slate-200 rounded-full text-xs">{tab.count}</span>}
                </button>
              );
            })}
          </div>

          {/* Daily Workers Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDailyOnly}
                onChange={(e) => setShowDailyOnly(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-slate-700">Show Daily Workers Only</span>
            </label>
          </div>

          {/* Payslips List */}
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading payslips...</div>
          ) : filteredPayslips.length === 0 ? (
            <PayrollEmptyState description="Generate payroll for an employee to see payslips here. Select an employee, choose a period, and click Generate." />
          ) : (
            <div className="space-y-4">
              <TimeGroupSection group="today" label={timeGroupLabels.today} />
              <TimeGroupSection group="yesterday" label={timeGroupLabels.yesterday} />
              <TimeGroupSection group="lastWeek" label={timeGroupLabels.lastWeek} />
              <TimeGroupSection group="lastMonth" label={timeGroupLabels.lastMonth} />
              <TimeGroupSection group="older" label={timeGroupLabels.older} />
            </div>
          )}

          {/* Disbursement Button */}
          {activeTab === 'approved' && filteredPayslips.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <Button variant="primary" onClick={() => navigate('/payroll/disburse')} className="w-full">
                Proceed to Disbursement →
              </Button>
            </div>
          )}
        </Card>
      </div>
      <PageInfoPanel
        title="Payroll"
        description="Compute and disburse employee salaries"
        steps={[
          'Select an employee from the dropdown and enter the pay period (YYYY-MM).',
          'Click Generate to compute gross pay (base + overtime + KPI bonuses) and deductions (PAYE, NSSF, NHIF).',
          'Review the generated payslip in the Draft tab.',
          'Approve the payslip to move it to the Approved tab.',
          'From the Approved tab, click Proceed to Disbursement to send payment via M-PESA B2C.',
        ]}
        faqs={[
          { q: 'Why is net pay showing as 0?', a: 'The employee has no pay rate configured. Go to Employees → Edit → set Basic Salary and Pay Rate.' },
          { q: 'KPI bonus is not showing in gross pay?', a: 'Ensure the KPI assessment for that period has been completed and the bonus is in Pending Bonuses status.' },
          { q: 'Attendance hours are 0 for the period?', a: 'The employee has no attendance records for the selected month. Check Attendance page.' },
          { q: 'M-PESA disbursement failed?', a: 'Verify the employee has a valid phone number in their profile and M-PESA API credentials are configured in Settings.' },
        ]}
        fetchStatus={async () => {
          const items = [];
          try {
            const [empRes, payRes] = await Promise.allSettled([
              api.get('/api/employees'),
              api.get('/api/payroll/payslips'),
            ]);
            const emps = empRes.status === 'fulfilled' ? (empRes.value.data || []) : [];
            const slips = payRes.status === 'fulfilled' ? (payRes.value.data || []) : [];
            const noPay = emps.filter(e => !e.basic_salary && !e.hourly_rate);
            if (noPay.length > 0) items.push({ level: 'warn', message: `${noPay.length} employee${noPay.length > 1 ? 's have' : ' has'} no pay rate set`, detail: 'Go to Employees → Edit → set Basic Salary or Hourly Rate.' });
            const zeroPay = slips.filter(s => s.status === 'draft' && Number(s.net_pay) === 0);
            if (zeroPay.length > 0) items.push({ level: 'error', message: `${zeroPay.length} draft payslip${zeroPay.length > 1 ? 's have' : ' has'} zero net pay`, detail: 'Review and fix pay rates or deductions before approving.' });
            const pending = slips.filter(s => s.status === 'approved' && !s.disbursed_at);
            if (pending.length > 0) items.push({ level: 'warn', message: `${pending.length} approved payslip${pending.length > 1 ? 's are' : ' is'} awaiting disbursement`, detail: 'Go to the Approved tab and proceed to M-PESA disbursement.' });
            if (items.length === 0) items.push({ level: 'success', message: 'Payroll is up to date — no issues found.' });
          } catch { items.push({ level: 'info', message: 'Could not retrieve payroll status. Ensure the backend is running.' }); }
          return items;
        }}
      />
    </div>
  );

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content;
}
