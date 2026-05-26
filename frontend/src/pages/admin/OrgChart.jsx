import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { employeeAPI } from '../../services/api';
import { cn } from '../../lib/utils';
import { Users, ChevronDown, ChevronRight, Building2, User } from 'lucide-react';

const DEPT_COLORS = [
  'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
  'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
  'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
  'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
  'border-pink-400 bg-pink-50 dark:bg-pink-900/20',
  'border-teal-400 bg-teal-50 dark:bg-teal-900/20',
  'border-amber-400 bg-amber-50 dark:bg-amber-900/20',
  'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
];

const EmployeeCard = ({ emp, colorClass }) => (
  <div className={cn('flex items-center gap-2 p-2 rounded-lg border text-xs', colorClass)}>
    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
      <User size={13} className="text-slate-500" />
    </div>
    <div className="min-w-0">
      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
        {emp.first_name} {emp.last_name}
      </p>
      <p className="text-slate-500 dark:text-slate-400 truncate capitalize">{emp.role || emp.employment_type}</p>
    </div>
  </div>
);

const DeptColumn = ({ dept, employees, colorClass, index }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col min-w-[200px] max-w-[240px]">
      <button
        onClick={() => setCollapsed(p => !p)}
        className={cn(
          'flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-2 font-semibold text-sm mb-3 transition-colors',
          colorClass
        )}
      >
        <div className="flex items-center gap-2">
          <Building2 size={15} />
          <span className="truncate">{dept}</span>
          <span className="ml-1 text-xs font-bold bg-white/60 dark:bg-black/20 rounded-full px-2 py-0.5">
            {employees.length}
          </span>
        </div>
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-2 pl-2 border-l-2 border-dashed border-slate-200 dark:border-slate-700">
          {employees.map(emp => (
            <EmployeeCard key={emp.id || emp._id} emp={emp} colorClass={cn('border', colorClass.split(' ')[0])} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function OrgChart({ standalone = true }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    employeeAPI.getAll()
      .then(res => setEmployees(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? employees.filter(e =>
        `${e.first_name} ${e.last_name} ${e.department} ${e.role}`.toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  const byDept = filtered.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {});

  const depts = Object.keys(byDept).sort();
  const totalActive = employees.filter(e => e.status !== 'inactive').length;

  const content = (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Org Chart</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Organisation structure by department — {employees.length} employees across {depts.length} departments
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Employees', value: employees.length, icon: Users },
          { label: 'Departments', value: depts.length, icon: Building2 },
          { label: 'Active', value: totalActive, icon: User },
          { label: 'Unassigned', value: (byDept['Unassigned'] || []).length, icon: User },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <s.icon size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, department or role…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : depts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {search ? `No employees matching "${search}"` : 'No employees found'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {depts.map((dept, i) => (
              <DeptColumn
                key={dept}
                dept={dept}
                employees={byDept[dept]}
                colorClass={DEPT_COLORS[i % DEPT_COLORS.length]}
                index={i}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content;
}
