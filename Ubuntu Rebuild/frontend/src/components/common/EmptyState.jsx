import { FileX, Users, Calendar, DollarSign, BarChart3, Briefcase, ClipboardList, GraduationCap, FolderOpen, Database, Search, AlertCircle } from 'lucide-react';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        {Icon && <Icon size={32} className="text-gray-400" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {action && action}
    </div>
  );
};

export const EmployeesEmptyState = () => (
  <EmptyState
    icon={Users}
    title="No employees found"
    description="Add employees to get started"
  />
);

export const AttendanceEmptyState = () => (
  <EmptyState
    icon={Calendar}
    title="No attendance records"
    description="Attendance records will appear here"
  />
);

export const PayrollEmptyState = () => (
  <EmptyState
    icon={DollarSign}
    title="No payroll records"
    description="Payroll records will appear here"
  />
);

export const KpiEmptyState = () => (
  <EmptyState
    icon={BarChart3}
    title="No KPI records"
    description="KPI records will appear here"
  />
);

export const LeaveEmptyState = () => (
  <EmptyState
    icon={FileX}
    title="No leave requests"
    description="Leave requests will appear here"
  />
);

export const RecruitmentEmptyState = () => (
  <EmptyState
    icon={Briefcase}
    title="No job postings"
    description="Create job postings to start recruiting"
  />
);

export const ReportsEmptyState = () => (
  <EmptyState
    icon={BarChart3}
    title="No reports available"
    description="Reports will be generated here"
  />
);

export const OnboardingEmptyState = () => (
  <EmptyState
    icon={ClipboardList}
    title="No onboarding records"
    description="Onboarding records will appear here"
  />
);

export const TrainingEmptyState = () => (
  <EmptyState
    icon={GraduationCap}
    title="No training records"
    description="Training records will appear here"
  />
);

export const DocumentsEmptyState = () => (
  <EmptyState
    icon={FolderOpen}
    title="No documents"
    description="Documents will appear here"
  />
);

export const DailyLabourEmptyState = () => (
  <EmptyState
    icon={Users}
    title="No daily labourers"
    description="Daily labourer records will appear here"
  />
);

export const SearchEmptyState = () => (
  <EmptyState
    icon={Search}
    title="No results found"
    description="Try adjusting your search criteria"
  />
);

export const ErrorEmptyState = ({ message }) => (
  <EmptyState
    icon={AlertCircle}
    title="Something went wrong"
    description={message || "Failed to load data. Please try again."}
  />
);

export default EmptyState;
