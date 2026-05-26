import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicHome from './pages/PublicHome';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Payments from './pages/payments/Payments';
import PaymentHistory from './pages/payments/PaymentHistory';
import DepartmentDashboard from './pages/departments/DepartmentDashboard';
import DepartmentsList from './pages/departments/DepartmentsList';
import MyDepartments from './pages/departments/MyDepartments';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDatabase from './pages/admin/AdminDatabase';
import SiteSettings from './pages/admin/SiteSettings';
import Profile from './pages/profile/Profile';
import ProfileManagement from './pages/profile/ProfileManagement';
import UserManagement from './pages/users/UserManagement';
import PaymentManagement from './pages/payments/PaymentManagement';
import MemberDirectory from './pages/members/MemberDirectory';
import SMS from './sms/SMS';
import Announcements from './pages/announcements/Announcements';
import Events from './pages/events/Events';
import PublicAnnouncementDetail from './pages/public/PublicAnnouncementDetail';
import Terms from './pages/public/Terms';
import Privacy from './pages/public/Privacy';
import ForgotPassword from './pages/auth/ForgotPassword';
import TreasuryDashboard from './pages/treasury/TreasuryDashboard';
import ChartOfAccounts from './pages/treasury/ChartOfAccounts';
import JournalEntries from './pages/treasury/JournalEntries';
import Budgets from './pages/treasury/Budgets';
import Expenses from './pages/treasury/Expenses';
import FinancialReports from './pages/treasury/FinancialReports';
import Funds from './pages/treasury/Funds';
import BankReconciliations from './pages/treasury/BankReconciliations';
import Contributions from './pages/treasury/Contributions';
import Vendors from './pages/treasury/Vendors';
import Projects from './pages/treasury/Projects';
import FixedAssets from './pages/treasury/FixedAssets';
import Pledges from './pages/treasury/Pledges';
import RecurringPayments from './pages/treasury/RecurringPayments';
import Receipts from './pages/treasury/Receipts';
import TreasuryAnalytics from './pages/treasury/TreasuryAnalytics';
import PhotoGalleryPage from './pages/PhotoGalleryPage';
import GalleryManagement from './pages/gallery/GalleryManagement';

// Create a router factory function that accepts darkMode props
export const createAppRouter = (darkMode, setDarkMode) => {
  return createBrowserRouter([
    {
      path: "/",
      element: <PublicLayout darkMode={darkMode} setDarkMode={setDarkMode} />,
      children: [
        {
          index: true,
          element: <PublicHome />
        },
        {
          path: "announcements/:announcementId",
          element: <PublicAnnouncementDetail />
        },
        {
          path: "announcements",
          element: <Announcements />
        },
        {
          path: "terms",
          element: <Terms />
        },
        {
          path: "privacy",
          element: <Privacy />
        },
        {
          path: "gallery",
          element: <PhotoGalleryPage />
        }
      ]
    },
    {
      path: "/auth",
      element: <AuthLayout />,
      children: [
        {
          path: "login",
          element: <Login />
        },
        {
          path: "forgot-password",
          element: <ForgotPassword />
        },
        {
          path: "register",
          element: <Register />
        }
      ]
    },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <DashboardLayout darkMode={darkMode} setDarkMode={setDarkMode} />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard/overview" replace />
        },
        {
          path: "overview",
          element: <Dashboard />
        },
        {
          path: "payments",
          element: <Payments />
        },
        {
          path: "payment-history",
          element: <PaymentHistory />
        },
        {
          path: "announcements",
          element: <Announcements />
        },
        {
          path: "events",
          element: <Events />
        },
        {
          path: "profile",
          element: <Profile />
        },
        {
          path: "profile-management",
          element: <ProfileManagement />
        },
        {
          path: "users",
          element: <UserManagement />
        },
        {
          path: "members",
          element: <MemberDirectory />
        },
        {
          path: "payment-management",
          element: <PaymentManagement />
        },
        {
          path: "departments",
          element: <DepartmentsList />
        },
        {
          path: "my-departments",
          element: <MyDepartments />
        },
        {
          path: "departments/:departmentId",
          element: <DepartmentDashboard />
        },
        {
          path: "admin",
          element: <AdminDashboard />
        },
        {
          path: "admin/database",
          element: <AdminDatabase />
        },
        {
          path: "admin/settings",
          element: <SiteSettings />
        },
        {
          path: "sms",
          element: <SMS />
        },
        {
          path: "treasury",
          element: <TreasuryDashboard />
        },
        {
          path: "treasury/accounts",
          element: <ChartOfAccounts />
        },
        {
          path: "treasury/journal-entries",
          element: <JournalEntries />
        },
        {
          path: "treasury/budgets",
          element: <Budgets />
        },
        {
          path: "treasury/expenses",
          element: <Expenses />
        },
        {
          path: "treasury/reports",
          element: <FinancialReports />
        },
        {
          path: "treasury/funds",
          element: <Funds />
        },
        {
          path: "treasury/reconciliations",
          element: <BankReconciliations />
        },
        {
          path: "treasury/contributions",
          element: <Contributions />
        },
        {
          path: "treasury/vendors",
          element: <Vendors />
        },
        {
          path: "treasury/projects",
          element: <Projects />
        },
        {
          path: "treasury/assets",
          element: <FixedAssets />
        },
        {
          path: "treasury/pledges",
          element: <Pledges />
        },
        {
          path: "treasury/recurring",
          element: <RecurringPayments />
        },
        {
          path: "treasury/receipts",
          element: <Receipts />
        },
        {
          path: "treasury/analytics",
          element: <TreasuryAnalytics />
        },
        {
          path: "gallery",
          element: <GalleryManagement />
        }
      ]
    },
    {
      path: "*",
      element: <Navigate to="/" replace />
    }
  ]);
};

export default createAppRouter;
