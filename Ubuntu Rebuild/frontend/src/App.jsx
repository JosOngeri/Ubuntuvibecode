import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './pages/public/Login';
import Dashboard from './pages/Dashboard';
import AdminLayout from './components/common/AdminLayout';
import EmployeeLayout from './components/common/EmployeeLayout';
import ManagerLayout from './components/common/ManagerLayout';
import OwnerLayout from './components/common/OwnerLayout';
import DailyLabourerLayout from './components/common/DailyLabourerLayout';
import ContractorLayout from './components/common/ContractorLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminEmployees from './pages/admin/Employees';
import AdminAttendance from './pages/admin/Attendance';
import AdminLeaves from './pages/admin/Leaves';
import AdminPayroll from './pages/admin/Payroll';
import AdminKpi from './pages/admin/Kpi';
import AdminJobs from './pages/admin/Jobs';
import AdminSettings from './pages/admin/Settings';
import AdminOnboarding from './pages/admin/Onboarding';
import AdminComplaints from './pages/admin/Complaints';
import AdminContractors from './pages/admin/Contractors';
import AdminContracts from './pages/admin/Contracts';
import AdminAssets from './pages/admin/Assets';
import AdminTraining from './pages/admin/Training';
import AdminDocuments from './pages/admin/Documents';
import AdminOrientation from './pages/admin/Orientation';
import AdminReports from './pages/admin/Reports';
import AdminLogs from './pages/admin/Logs';
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeAttendance from './pages/employee/Attendance';
import EmployeeLeaves from './pages/employee/Leaves';
import EmployeePayroll from './pages/employee/Payroll';
import EmployeeKpi from './pages/employee/Kpi';
import EmployeeDocuments from './pages/employee/Documents';
import EmployeeOrientation from './pages/employee/Orientation';
import EmployeeComplaints from './pages/employee/Complaints';
import EmployeeProfile from './pages/employee/Profile';
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerEmployees from './pages/manager/Employees';
import ManagerAttendance from './pages/manager/Attendance';
import ManagerLeaves from './pages/manager/Leaves';
import ManagerKpi from './pages/manager/Kpi';
import ManagerJobs from './pages/manager/Jobs';
import ManagerOnboarding from './pages/manager/Onboarding';
import ManagerComplaints from './pages/manager/Complaints';
import ManagerContractors from './pages/manager/Contractors';
import ManagerAssets from './pages/manager/Assets';
import ManagerTraining from './pages/manager/Training';
import ManagerOrientation from './pages/manager/Orientation';
import ManagerDocuments from './pages/manager/Documents';
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerEmployees from './pages/owner/Employees';
import OwnerAttendance from './pages/owner/Attendance';
import OwnerLeaves from './pages/owner/Leaves';
import OwnerPayroll from './pages/owner/Payroll';
import OwnerKpi from './pages/owner/Kpi';
import OwnerJobs from './pages/owner/Jobs';
import OwnerOnboarding from './pages/owner/Onboarding';
import OwnerComplaints from './pages/owner/Complaints';
import OwnerContractors from './pages/owner/Contractors';
import OwnerContracts from './pages/owner/Contracts';
import OwnerAssets from './pages/owner/Assets';
import OwnerTraining from './pages/owner/Training';
import OwnerDocuments from './pages/owner/Documents';
import OwnerOrientation from './pages/owner/Orientation';
import OwnerReports from './pages/owner/Reports';
import OwnerSettings from './pages/owner/Settings';
import OwnerLogs from './pages/owner/Logs';
import DailyLabourerDashboard from './pages/daily-labourer/Dashboard';
import DailyLabourerAttendance from './pages/daily-labourer/Attendance';
import DailyLabourerPayments from './pages/daily-labourer/Payments';
import DailyLabourerProfile from './pages/daily-labourer/Profile';
import ContractorDashboard from './pages/contractor/Dashboard';
import ContractorQuotes from './pages/contractor/Quotes';
import ContractorMilestones from './pages/contractor/Milestones';
import ContractorPayments from './pages/contractor/Payments';
import ContractorProfile from './pages/contractor/Profile';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="leaves" element={<AdminLeaves />} />
            <Route path="payroll" element={<AdminPayroll />} />
            <Route path="kpi" element={<AdminKpi />} />
            <Route path="jobs" element={<AdminJobs />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="onboarding" element={<AdminOnboarding />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="contractors" element={<AdminContractors />} />
            <Route path="contracts" element={<AdminContracts />} />
            <Route path="assets" element={<AdminAssets />} />
            <Route path="training" element={<AdminTraining />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="orientation" element={<AdminOrientation />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="logs" element={<AdminLogs />} />
          </Route>
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="leaves" element={<EmployeeLeaves />} />
            <Route path="payroll" element={<EmployeePayroll />} />
            <Route path="kpi" element={<EmployeeKpi />} />
            <Route path="documents" element={<EmployeeDocuments />} />
            <Route path="orientation" element={<EmployeeOrientation />} />
            <Route path="complaints" element={<EmployeeComplaints />} />
            <Route path="profile" element={<EmployeeProfile />} />
          </Route>
          <Route path="/manager" element={<ManagerLayout />}>
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="employees" element={<ManagerEmployees />} />
            <Route path="attendance" element={<ManagerAttendance />} />
            <Route path="leaves" element={<ManagerLeaves />} />
            <Route path="kpi" element={<ManagerKpi />} />
            <Route path="jobs" element={<ManagerJobs />} />
            <Route path="onboarding" element={<ManagerOnboarding />} />
            <Route path="complaints" element={<ManagerComplaints />} />
            <Route path="contractors" element={<ManagerContractors />} />
            <Route path="assets" element={<ManagerAssets />} />
            <Route path="training" element={<ManagerTraining />} />
            <Route path="orientation" element={<ManagerOrientation />} />
            <Route path="documents" element={<ManagerDocuments />} />
          </Route>
          <Route path="/owner" element={<OwnerLayout />}>
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="employees" element={<OwnerEmployees />} />
            <Route path="attendance" element={<OwnerAttendance />} />
            <Route path="leaves" element={<OwnerLeaves />} />
            <Route path="payroll" element={<OwnerPayroll />} />
            <Route path="kpi" element={<OwnerKpi />} />
            <Route path="jobs" element={<OwnerJobs />} />
            <Route path="onboarding" element={<OwnerOnboarding />} />
            <Route path="complaints" element={<OwnerComplaints />} />
            <Route path="contractors" element={<OwnerContractors />} />
            <Route path="contracts" element={<OwnerContracts />} />
            <Route path="assets" element={<OwnerAssets />} />
            <Route path="training" element={<OwnerTraining />} />
            <Route path="documents" element={<OwnerDocuments />} />
            <Route path="orientation" element={<OwnerOrientation />} />
            <Route path="reports" element={<OwnerReports />} />
            <Route path="settings" element={<OwnerSettings />} />
            <Route path="logs" element={<OwnerLogs />} />
          </Route>
          <Route path="/daily-labourer" element={<DailyLabourerLayout />}>
            <Route path="dashboard" element={<DailyLabourerDashboard />} />
            <Route path="attendance" element={<DailyLabourerAttendance />} />
            <Route path="payments" element={<DailyLabourerPayments />} />
            <Route path="profile" element={<DailyLabourerProfile />} />
          </Route>
          <Route path="/contractor" element={<ContractorLayout />}>
            <Route path="dashboard" element={<ContractorDashboard />} />
            <Route path="quotes" element={<ContractorQuotes />} />
            <Route path="milestones" element={<ContractorMilestones />} />
            <Route path="payments" element={<ContractorPayments />} />
            <Route path="profile" element={<ContractorProfile />} />
          </Route>
        </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
