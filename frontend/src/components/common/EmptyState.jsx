import React from 'react';
import { cn } from '../../lib/utils';
import {
  Users,
  DollarSign,
  Target,
  CalendarOff,
  Briefcase,
  FileText,
  AlertCircle,
  Search,
  Inbox,
  ClipboardList,
  HardHat,
  BookOpen,
} from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = '',
  action = null,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: { wrapper: 'py-8', icon: 20, title: 'text-base', desc: 'text-xs' },
    md: { wrapper: 'py-14', icon: 40, title: 'text-lg', desc: 'text-sm' },
    lg: { wrapper: 'py-20', icon: 56, title: 'text-xl', desc: 'text-base' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      className={cn('flex flex-col items-center justify-center text-center', s.wrapper, className)}
    >
      <div className="mb-4 rounded-full bg-slate-100 dark:bg-slate-800 p-4">
        <Icon size={s.icon} className="text-slate-400 dark:text-slate-500" />
      </div>
      <p className={cn('font-semibold text-slate-700 dark:text-slate-300 mb-1', s.title)}>
        {title}
      </p>
      {description && (
        <p className={cn('text-slate-500 dark:text-slate-400 max-w-sm', s.desc)}>{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {action.icon && <action.icon size={16} />}
          {action.label}
        </button>
      )}
    </div>
  );
};

export const EmployeesEmptyState = props => (
  <EmptyState
    icon={Users}
    title="No employees found"
    description="Add your first employee or adjust your search filters."
    {...props}
  />
);

export const PayrollEmptyState = props => (
  <EmptyState
    icon={DollarSign}
    title="No payslips yet"
    description="Generate payroll for an employee to see payslips here."
    {...props}
  />
);

export const KpiEmptyState = props => (
  <EmptyState
    icon={Target}
    title="No KPIs found"
    description="Create KPI definitions and assign them to employees to get started."
    {...props}
  />
);

export const LeaveEmptyState = props => (
  <EmptyState
    icon={CalendarOff}
    title="No leave requests"
    description="No leave requests match the current filters."
    {...props}
  />
);

export const RecruitmentEmptyState = props => (
  <EmptyState
    icon={Briefcase}
    title="No job postings"
    description="Create your first job posting to start attracting applicants."
    {...props}
  />
);

export const ReportsEmptyState = props => (
  <EmptyState
    icon={FileText}
    title="No report data"
    description="Select filters and click Generate to view report data."
    {...props}
  />
);

export const OnboardingEmptyState = props => (
  <EmptyState
    icon={ClipboardList}
    title="No onboarding records"
    description="Initiate onboarding for a new employee to see records here."
    {...props}
  />
);

export const TrainingEmptyState = props => (
  <EmptyState
    icon={BookOpen}
    title="No training records"
    description="Add a training record to start tracking employee development."
    {...props}
  />
);

export const DailyLabourEmptyState = props => (
  <EmptyState
    icon={HardHat}
    title="No daily labourers"
    description="Register a daily labourer to start tracking their attendance and payments."
    {...props}
  />
);

export const SearchEmptyState = ({ query, ...props }) => (
  <EmptyState
    icon={Search}
    title={query ? `No results for "${query}"` : 'No results found'}
    description="Try adjusting your search terms or filters."
    size="sm"
    {...props}
  />
);

export const ErrorEmptyState = ({ message, onRetry, ...props }) => (
  <EmptyState
    icon={AlertCircle}
    title="Something went wrong"
    description={message || 'An error occurred while loading data.'}
    action={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
    {...props}
  />
);

export default EmptyState;
