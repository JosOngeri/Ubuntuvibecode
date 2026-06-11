import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import DateDropdown from '../../components/common/DateDropdown';
import api from '../../services/api';
import { employeeAPI } from '../../features/employees/services/employee.api';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BsCash,
  BsCalendarWeek,
  BsPeople,
  BsClock,
  BsCheckCircle,
  BsHourglass,
  BsXCircle,
  BsChevronDown,
  BsChevronUp,
  BsFileText,
  BsGraphUp,
  BsCalculator,
  BsGear,
} from 'react-icons/bs';
import PageInfoPanel from '../../components/common/PageInfoPanel';
import { PayrollEmptyState } from '../../components/common/EmptyState';

const formatMoney = value => {
  const num = Number(value || 0);
  if (isNaN(num) || !isFinite(num)) return 'KES 0.00';
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(num);
};

export default function Payroll({ standalone = true }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    period: new Date().toISOString().slice(0, 7),
  });
  const [activeTab, setActiveTab] = useState('draft');
  const [payrollSettings, setPayrollSettings] = useState({
    payeRate: 30,
    nssfRate: 6,
    nhifRate: 2.5,
    overtimeRate: 1.5,
    kpiBonusThreshold: 85,
    kpiBonusPercentage: 10,
  });
  const [loadingPayrollSettings, setLoadingPayrollSettings] = useState(false);
  const [showDailyOnly, setShowDailyOnly] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  // Helper functions for time grouping
  const getTimeGroup = date => {
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

  const groupPayslipsByTime = payslipsList => {
    const groups = {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    };

    payslipsList.forEach(payslip => {
      const group = getTimeGroup(payslip.created_at);
      groups[group].push(payslip);
    });

    return groups;
  };

  const toggleCard = id => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGroup = group => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getEmployeeById = id =>
    employees.find(emp => emp.id === id || emp._id === id || String(emp.id) === String(id));

  const isDailyWorker = payslip => {
    const emp = getEmployeeById(payslip.employee_id);
    return emp?.employment_type === 'Daily' || emp?.employment_type === 'Daily Worker';
  };

  const calculateStats = useMemo(() => {
    const draftCount = payslips.filter(p => p.status === 'Draft').length;
    const approvedCount = payslips.filter(p => p.status === 'Approved').length;
    const paidCount = payslips.filter(p => p.status === 'Paid').length;
    const failedCount = payslips.filter(p => p.status === 'Failed').length;
    const dailyWorkersCount = employees.filter(
      e => e.employment_type === 'Daily' || e.employment_type === 'Daily Worker'
    ).length;
    const monthlyEmployeesCount = employees.filter(
      e => e.employment_type === 'Monthly' || e.employment_type === 'Permanent'
    ).length;

    const now = new Date();
    const thisMonth = payslips.filter(p => {
      const date = new Date(p.created_at);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear() &&
        p.status === 'Paid'
      );
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
      totalPayroll: payslips.reduce((sum, p) => sum + (p.net_pay || 0), 0),
    };
  }, [payslips, employees]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, payRes] = await Promise.all([
        employeeAPI.getAll().catch(() => ({ data: [] })),
        api.get('/api/payroll').catch(() => ({ data: [] })),
      ]);
      setEmployees(empRes.data || []);
      setPayslips(payRes.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPayrollSettings = async () => {
    try {
      setLoadingPayrollSettings(true);
      const response = await api.get('/settings/payroll');
      if (response.data.settings) {
        setPayrollSettings(response.data.settings);
      }
    } catch (err) {
      console.error('Failed to load payroll settings:', err);
    } finally {
      setLoadingPayrollSettings(false);
    }
  };

  const handleSavePayrollSettings = async () => {
    try {
      setGenerating(true);
      await api.put('/settings/payroll', payrollSettings);
      toast.success('Payroll settings saved successfully');
    } catch (err) {
      toast.error('Failed to save payroll settings');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'settings') {
      loadPayrollSettings();
    }
  }, [activeTab]);

  const handleCalculate = async e => {
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

  const handleApprove = async id => {
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
    { id: 'draft', label: 'Review', icon: BsHourglass, count: calculateStats.draftCount },
    {
      id: 'approved',
      label: 'Send Payment',
      icon: BsCheckCircle,
      count: calculateStats.approvedCount,
    },
    { id: 'paid', label: 'Sent', icon: BsCash, count: calculateStats.paidCount },
    { id: 'failed', label: 'Failed', icon: BsXCircle, count: calculateStats.failedCount },
    { id: 'settings', label: 'Settings', icon: BsGear },
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
    older: 'Older',
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
                {emp
                  ? `${(emp.first_name || emp.firstName || '')?.[0]}${(emp.last_name || emp.lastName || '')?.[0]}`.toUpperCase()
                  : '??'}
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {emp
                    ? `${emp.first_name || emp.firstName || ''} ${emp.last_name || emp.lastName || ''}`.trim()
                    : 'Unknown Employee'}
                </div>
                <div className="text-sm text-slate-500">
                  {payslip.period} • {isDaily ? 'Daily Worker' : 'Monthly Employee'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-bold text-lg text-slate-900">
                  {formatMoney(payslip.net_pay)}
                </div>
                <div className="text-xs text-slate-500">Take-home Pay</div>
              </div>
              <BsChevronDown
                className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-500">Base Pay</div>
                <div className="font-semibold text-slate-900">{formatMoney(payslip.gross_pay)}</div>
              </div>
              <div>
                <div className="text-slate-500">Extra Pay (Overtime)</div>
                <div className="font-semibold text-slate-900">
                  {formatMoney(payslip.overtime_pay)}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Performance Bonus</div>
                <div className="font-semibold text-slate-900">{formatMoney(payslip.kpi_bonus)}</div>
              </div>
              <div>
                <div className="text-slate-500">Tax & Deductions</div>
                <div className="font-semibold text-rose-600">{formatMoney(payslip.deductions)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-slate-500">Payment Method</div>
                <div className="font-semibold text-slate-900">{payslip.payment_method}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {payslip.status === 'Draft' && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={e => {
                    e.stopPropagation();
                    handleApprove(payslip.id);
                  }}
                >
                  Approve for Payment
                </Button>
              )}
              {payslip.status === 'Approved' && (
                <Button size="sm" variant="primary" onClick={() => navigate('/payroll/disburse')}>
                  Send Payment
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
          <BsChevronDown
            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
          <h3 className="font-semibold text-slate-900">
            {label} ({payslipsInGroup.length})
          </h3>
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
        <h1 className="page-title">Payroll</h1>
        <p className="page-subtitle">Calculate and send payments to employees in 4 simple steps.</p>
      </div>

      {/* Step-by-Step Guide */}
      <Card className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <h2 className="text-lg font-bold mb-4 text-slate-900">How to Pay Employees</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              step: 1,
              title: 'Generate',
              desc: 'Select employee & month to calculate pay',
              icon: BsCalculator,
            },
            {
              step: 2,
              title: 'Review',
              desc: 'Check the calculated amount in Draft',
              icon: BsFileText,
            },
            { step: 3, title: 'Approve', desc: 'Mark as ready for payment', icon: BsCheckCircle },
            { step: 4, title: 'Send Money', desc: 'Send via M-PESA to employees', icon: BsCash },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
                {step}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{title}</div>
                <div className="text-sm text-slate-600">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold text-slate-900">{calculateStats.draftCount}</div>
          <div className="text-sm text-slate-500">Ready to Review</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-slate-900">{calculateStats.approvedCount}</div>
          <div className="text-sm text-slate-500">Ready to Send</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-slate-900">{calculateStats.paidCount}</div>
          <div className="text-sm text-slate-500">Sent Successfully</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-slate-900">
            {formatMoney(calculateStats.paidThisMonth)}
          </div>
          <div className="text-sm text-slate-500">Sent This Month</div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel - Calculate */}
        <Card className="xl:col-span-1 h-fit">
          <h2 className="text-lg font-bold mb-4">Calculate Payment</h2>
          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Select Employee</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.employeeId}
                onChange={e => setForm({ ...form, employeeId: e.target.value })}
                required
              >
                <option value="">Choose an employee...</option>
                {employees.map(emp => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Pay Month"
              type="month"
              value={form.period}
              onChange={e => setForm({ ...form, period: e.target.value })}
              required
            />
            <Button type="submit" variant="primary" className="w-full" loading={generating}>
              Calculate Pay
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button
              variant="secondary"
              onClick={handleBatchGenerate}
              loading={generating}
              className="w-full mb-2"
            >
              Calculate All (Monthly Staff)
            </Button>
            {activeTab === 'draft' && (
              <Button
                variant="success"
                onClick={handleBatchApprove}
                loading={generating}
                className="w-full"
              >
                Approve All for Payment
              </Button>
            )}
          </div>

          <div className="mt-4 p-4 bg-amber-50 rounded-lg text-sm text-slate-700">
            <strong>Pay Calculation:</strong> Base pay + Overtime + Bonus - Tax & Deductions =
            Take-home Pay
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
                  {tab.count > 0 && (
                    <span className="px-2 py-0.5 bg-slate-200 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Daily Workers Toggle */}
          {activeTab !== 'settings' && (
            <div className="flex items-center gap-2 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDailyOnly}
                  onChange={e => setShowDailyOnly(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-slate-700">Show daily workers only</span>
              </label>
            </div>
          )}

          {/* Settings Tab Content */}
          {activeTab === 'settings' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tax & Deductions */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Tax & Deductions
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        PAYE Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={payrollSettings.payeRate}
                        onChange={e =>
                          setPayrollSettings(prev => ({
                            ...prev,
                            payeRate: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Income tax deducted from gross pay
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        NSSF Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={payrollSettings.nssfRate}
                        onChange={e =>
                          setPayrollSettings(prev => ({
                            ...prev,
                            nssfRate: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        National Social Security Fund contribution
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        NHIF Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={payrollSettings.nhifRate}
                        onChange={e =>
                          setPayrollSettings(prev => ({
                            ...prev,
                            nhifRate: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        National Hospital Insurance Fund contribution
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overtime & Bonuses */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Overtime & Bonuses
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Overtime Multiplier
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={payrollSettings.overtimeRate}
                        onChange={e =>
                          setPayrollSettings(prev => ({
                            ...prev,
                            overtimeRate: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        e.g., 1.5 = 1.5x hourly rate for overtime
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        KPI Bonus Threshold (%)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={payrollSettings.kpiBonusThreshold}
                        onChange={e =>
                          setPayrollSettings(prev => ({
                            ...prev,
                            kpiBonusThreshold: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Minimum score to qualify for KPI bonus
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        KPI Bonus Percentage (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={payrollSettings.kpiBonusPercentage}
                        onChange={e =>
                          setPayrollSettings(prev => ({
                            ...prev,
                            kpiBonusPercentage: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Percentage of base salary as bonus
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePayrollSettings} loading={generating} variant="primary">
                  Save Payroll Settings
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Payslips List */}
              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : filteredPayslips.length === 0 ? (
                <PayrollEmptyState description="No payments to show. Select an employee and calculate their pay to get started." />
              ) : (
                <div className="space-y-4">
                  <TimeGroupSection group="today" label={timeGroupLabels.today} />
                  <TimeGroupSection group="yesterday" label={timeGroupLabels.yesterday} />
                  <TimeGroupSection group="lastWeek" label={timeGroupLabels.lastWeek} />
                  <TimeGroupSection group="lastMonth" label={timeGroupLabels.lastMonth} />
                  <TimeGroupSection group="older" label={timeGroupLabels.older} />
                </div>
              )}

              {/* Send Payment Button */}
              {activeTab === 'approved' && filteredPayslips.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/payroll/disburse')}
                    className="w-full"
                  >
                    Send Payments via M-PESA →
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
      <PageInfoPanel
        title="Payroll"
        description="Compute and disburse employee salaries"
        steps={[
          'Choose an employee and the month you want to pay for.',
          'Click "Calculate Pay" to see how much they should receive.',
          'Review the amount in the "Review" tab before approving.',
          'Click "Approve for Payment" to mark it as ready to send.',
          'Go to "Send Payment" tab and click "Send Payments via M-PESA" to transfer money.',
        ]}
        faqs={[
          {
            q: 'Why is the pay amount 0?',
            a: 'The employee does not have a salary rate set. Go to Employees → Edit and set their Basic Salary.',
          },
          {
            q: 'Performance bonus not included?',
            a: 'The employee has not been assessed for performance yet. Complete their KPI evaluation first.',
          },
          {
            q: 'No hours worked showing?',
            a: 'The employee has no attendance records for this month. Check the Attendance page.',
          },
          {
            q: 'M-PESA payment failed?',
            a: 'Make sure the employee has a valid phone number and your M-PESA API is set up in Settings.',
          },
        ]}
        fetchStatus={async () => {
          const items = [];
          try {
            const [empRes, payRes] = await Promise.allSettled([
              api.get('/api/employees'),
              api.get('/api/payroll/payslips'),
            ]);
            const emps = empRes.status === 'fulfilled' ? empRes.value.data || [] : [];
            const slips = payRes.status === 'fulfilled' ? payRes.value.data || [] : [];
            const noPay = emps.filter(e => !e.basic_salary && !e.hourly_rate);
            if (noPay.length > 0)
              items.push({
                level: 'warn',
                message: `${noPay.length} employee${noPay.length > 1 ? 's have' : ' has'} no salary set`,
                detail: 'Go to Employees → Edit and set their Basic Salary.',
              });
            const zeroPay = slips.filter(s => s.status === 'draft' && Number(s.net_pay) === 0);
            if (zeroPay.length > 0)
              items.push({
                level: 'error',
                message: `${zeroPay.length} payment${zeroPay.length > 1 ? 's have' : ' has'} zero amount`,
                detail: 'Check the salary rate before approving.',
              });
            const pending = slips.filter(s => s.status === 'approved' && !s.disbursed_at);
            if (pending.length > 0)
              items.push({
                level: 'warn',
                message: `${pending.length} payment${pending.length > 1 ? 's are' : ' is'} ready to send`,
                detail: 'Go to the "Send Payment" tab to transfer via M-PESA.',
              });
            if (items.length === 0)
              items.push({ level: 'success', message: 'Payroll is up to date — no issues found.' });
          } catch {
            items.push({
              level: 'info',
              message: 'Could not retrieve payroll status. Ensure the backend is running.',
            });
          }
          return items;
        }}
      />
    </div>
  );

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content;
}
