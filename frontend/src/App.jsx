import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useScrollToTop from './hooks/useScrollToTop';
import Favicon from './components/common/Favicon';

// Recruitment Pages
import JobPostingManagement from './pages/recruitment/JobPostingManagement';
import Landing from './pages/recruitment/Landing';
import PublicJobBoard from './pages/recruitment/PublicJobBoard';
import JobApplicationForm from './pages/recruitment/JobApplicationForm';
import ApplicantReviewDashboard from './pages/recruitment/ApplicantReviewDashboard';
import MyApplications from './pages/recruitment/MyApplications';
import ProfileUpdateForm from './pages/recruitment/ProfileUpdateForm';
import ProfileView from './pages/recruitment/ProfileView';
import ProfileIndex from './pages/profile/index';
import Settings from './pages/settings/index';
import ApplicantDetail from './pages/recruitment/ApplicantDetail';
import JobDetail from './pages/recruitment/JobDetail';
import JobDescription from './pages/recruitment/JobDescription';
import CreateJobAdvertisement from './pages/recruitment/CreateJobAdvertisement';
import InterviewFeedback from './pages/recruitment/InterviewFeedback';
import ShortlistPage from './pages/recruitment/ShortlistPage';
import AllApplicantsPage from './pages/recruitment/AllApplicantsPage';
import ApplicantDetailPage from './pages/recruitment/ApplicantDetailPage';
import OnboardingPage from './pages/onboarding/index';
import OnboardingWizard from './features/onboarding/pages/OnboardingWizard';
import DailyLabourPage from './pages/dailyLabour/index';
import DailyLabourerDashboard from './pages/dailyLabour/Dashboard';
import SupervisorDashboard from './pages/supervisor/Dashboard';
import ComplaintsPage from './pages/complaints/index';
import AssetsPage from './pages/assets/index';
import ContractorsPage from './pages/contractors/index';
import ReportsPage from './pages/reports/index';
import MessagesPage from './pages/messages/index';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminEmployees from './features/employees/pages/Employees';
import AdminUsers from './pages/admin/Users';
import Permissions from './pages/admin/Permissions';
import AdminSettings from './pages/admin/Settings';
import UserDetail from './pages/admin/UserDetail';
import EmployeeDetail from './features/employees/pages/EmployeeDetail';

// Manager & Employee Pages
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerLeaves from './pages/manager/Leaves';
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeLeaves from './pages/employee/Leaves';
import LeaveRequest from './features/leave/pages/Request';
import LeaveApprovals from './features/leave/pages/Approvals';
import LeaveStatutory from './features/leave/pages/Statutory';
import Punch from './features/attendance/pages/Punch';
import AttendancePage from './pages/shared/Attendance';
import AttendanceDetail from './pages/shared/AttendanceDetail';

// Payroll Pages
import PayrollDisburse from './features/payroll/pages/Disburse';
import EmployeePayslips from './features/payroll/pages/Payslips';

// KPI Pages
import KpiManage from './pages/kpi/Manage';
import KpiAssessment from './pages/kpi/Assessment';
import MyGoals from './pages/kpi/MyGoals';

// Contractor Pages
import ContractorDashboard from './pages/contractor/Dashboard';
import ContractorProjects from './pages/contractor/Projects';
import ContractorInvoices from './pages/contractor/Invoices';
import ContractorPortal from './pages/contractor/Portal';

// Contract Review
import ContractReview from './pages/contracts/Review';

// Admin Pages
import AdminKPI from './pages/admin/KPI';
import AdminLeave from './pages/admin/Leave';
import AdminPayroll from './pages/admin/Payroll';
import AdminContract from './pages/admin/Contract';
import OrgChart from './pages/admin/OrgChart';
import Training from './pages/admin/Training';
import DocumentVault from './pages/admin/DocumentVault';
import SupervisorAllocations from './pages/admin/SupervisorAllocations';
import DepartmentHeadAssignments from './pages/admin/DepartmentHeadAssignments';
import OrientationChecklists from './pages/admin/OrientationChecklists';
import ContractorLifecycle from './pages/admin/ContractorLifecycle';

// Wrapper Pages
import DashboardPage from './pages/admin/DashboardPage';
import PeoplePage from './pages/admin/PeoplePage';
import AdminAttendancePage from './features/attendance/pages/AttendancePage';
import AdminPayrollPage from './pages/admin/PayrollPage';
import PerformancePage from './pages/admin/PerformancePage';
import ContractsPage from './pages/admin/ContractsPage';
import HROpsPage from './pages/admin/HROpsPage';
import ResourcesPage from './pages/admin/ResourcesPage';

// Wrappers for dynamic routes
function JobApplicationFormWrapper() {
  const { jobId } = useParams();
  return <JobApplicationForm jobId={jobId} />;
}

function ApplicantReviewDashboardWrapper() {
  const { jobId } = useParams();
  return <ApplicantReviewDashboard jobId={jobId} />;
}

function ApplicantDetailWrapper() {
  const { jobId, applicantId } = useParams();
  return <ApplicantDetail jobId={jobId} applicantId={applicantId} />;
}

function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="w-48 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full animate-[loading-bar_1s_ease-in-out_infinite]"></div>
        </div>
      </div>
    );
  if (!user) return <Navigate to="/" replace />;

  if (user.role === 'owner') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'admin' || user.role === 'hr')
    return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'manager' || user.role === 'supervisor')
    return <Navigate to="/manager/dashboard" replace />;
  if (user.role === 'contractor') return <Navigate to="/contractor/dashboard" replace />;
  if (user.role === 'daily_labourer') return <Navigate to="/daily-labour/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/people"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <PeoplePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <AdminEmployees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees/:employeeId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <EmployeeDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users/:userId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <UserDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/permissions"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <Permissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <AdminAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attendance/:attendanceId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <AttendanceDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/kpis"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <AdminKPI />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/performance"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'hr']}>
                  <PerformancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/leaves"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <AdminLeave />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payroll"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <AdminPayrollPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/contracts"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <ContractsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/hr-ops"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'hr']}>
                  <HROpsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/resources"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'hr']}>
                  <ResourcesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/org-chart"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
                  <OrgChart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/training"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'hr']}>
                  <Training />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/documents"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'hr']}>
                  <DocumentVault />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/supervisor-allocations"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
                  <SupervisorAllocations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/department-head-assignments"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
                  <DepartmentHeadAssignments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/onboarding"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'hr']}>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orientation-checklists"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'hr']}>
                  <OrientationChecklists />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/contractor-lifecycle"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
                  <ContractorLifecycle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/:applicationId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'hr']}>
                  <OnboardingWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/daily-labour"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
                  <DailyLabourPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
                  <ComplaintsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/assets"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
                  <AssetsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/contractors"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
                  <ContractorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            {/* Manager Routes */}
            <Route
              path="/manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={['manager', 'supervisor', 'owner']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supervisor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['supervisor']}>
                  <SupervisorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/attendance"
              element={
                <ProtectedRoute allowedRoles={['manager', 'supervisor', 'owner']}>
                  <AttendancePage role="manager" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/attendance/:attendanceId"
              element={
                <ProtectedRoute allowedRoles={['manager', 'supervisor', 'owner']}>
                  <AttendanceDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/leaves"
              element={
                <ProtectedRoute allowedRoles={['manager', 'supervisor', 'owner']}>
                  <ManagerLeaves />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/request"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <LeaveRequest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/approvals"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'supervisor', 'owner']}>
                  <LeaveApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/statutory"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'owner']}>
                  <LeaveStatutory />
                </ProtectedRoute>
              }
            />

            {/* Daily Labourer Routes */}
            <Route
              path="/daily-labour/dashboard"
              element={
                <ProtectedRoute allowedRoles={['daily_labourer']}>
                  <DailyLabourerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/daily-labour/attendance"
              element={
                <ProtectedRoute allowedRoles={['daily_labourer']}>
                  <DailyLabourerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/daily-labour/payments"
              element={
                <ProtectedRoute allowedRoles={['daily_labourer']}>
                  <DailyLabourerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Employee Routes */}
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute allowedRoles={['employee', 'daily_labourer']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/leaves"
              element={
                <ProtectedRoute allowedRoles={['employee', 'daily_labourer']}>
                  <EmployeeLeaves />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/payslips"
              element={
                <ProtectedRoute allowedRoles={['employee', 'daily_labourer']}>
                  <EmployeePayslips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/attendance"
              element={
                <ProtectedRoute allowedRoles={['employee', 'daily_labourer']}>
                  <AttendancePage role="employee" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/punch"
              element={
                <ProtectedRoute allowedRoles={['employee', 'daily_labourer']}>
                  <Punch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/attendance/:attendanceId"
              element={
                <ProtectedRoute allowedRoles={['employee', 'daily_labourer']}>
                  <AttendanceDetail />
                </ProtectedRoute>
              }
            />

            {/* Contractor Routes */}
            <Route
              path="/contractor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['contractor']}>
                  <ContractorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contractor/projects"
              element={
                <ProtectedRoute allowedRoles={['contractor']}>
                  <ContractorProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contractor/invoices"
              element={
                <ProtectedRoute allowedRoles={['contractor']}>
                  <ContractorInvoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contractor/portal"
              element={
                <ProtectedRoute allowedRoles={['contractor']}>
                  <ContractorPortal />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payroll/disburse"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <PayrollDisburse />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kpi/manage"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'supervisor']}>
                  <KpiManage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kpi/assessment"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'supervisor']}>
                  <KpiAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kpi/my-goals"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <MyGoals />
                </ProtectedRoute>
              }
            />

            <Route
              path="/contracts/review"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <ContractReview />
                </ProtectedRoute>
              }
            />

            {/* Recruitment Portal Routes */}
            <Route
              path="/recruitment/jobs"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
                  <JobPostingManagement />
                </ProtectedRoute>
              }
            />
            <Route path="/recruitment/jobs-board" element={<PublicJobBoard />} />
            <Route path="/recruitment/job/:jobId" element={<JobDescription />} />
            <Route
              path="/recruitment/interview-feedback/:appId/:token"
              element={<InterviewFeedback />}
            />
            <Route
              path="/recruitment/shortlist"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
                  <ShortlistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/applicants"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
                  <AllApplicantsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/applicants/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
                  <ApplicantDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/jobs/:jobId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
                  <JobDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/create-advertisement"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
                  <CreateJobAdvertisement />
                </ProtectedRoute>
              }
            />
            <Route path="/recruitment/apply/:jobId" element={<JobApplicationFormWrapper />} />
            <Route
              path="/recruitment/my-applications"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr', 'employee', 'supervisor']}>
                  <MyApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/jobs/:jobId/applicants"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
                  <ApplicantReviewDashboardWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/jobs/:jobId/applicants/:applicantId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr']}>
                  <ApplicantDetailWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/view"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr', 'employee', 'contractor']}>
                  <ProfileView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/update"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'hr', 'employee', 'contractor']}>
                  <ProfileUpdateForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute
                  allowedRoles={['admin', 'manager', 'supervisor', 'employee', 'contractor', 'hr']}
                >
                  <DashboardRedirect />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute
                  allowedRoles={['admin', 'manager', 'supervisor', 'employee', 'contractor', 'hr']}
                >
                  <ProfileIndex />
                </ProtectedRoute>
              }
            />

            {/* Settings Route */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute
                  allowedRoles={['admin', 'manager', 'supervisor', 'employee', 'contractor', 'hr']}
                >
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Messages Route */}
            <Route
              path="/messages"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'admin',
                    'manager',
                    'supervisor',
                    'employee',
                    'contractor',
                    'hr',
                    'daily_labourer',
                  ]}
                >
                  <MessagesPage />
                </ProtectedRoute>
              }
            />

            {/* Root redirect — landing page with Job Opportunities button */}
            <Route path="/" element={<Landing />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Favicon />

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
