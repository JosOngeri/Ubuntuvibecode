import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import TabNavigation from '../../components/common/TabNavigation';
import { BsSpeedometer2, BsGraphUp } from 'react-icons/bs';
import AdminDashboard from './Dashboard';
import ReportsPage from '../reports/index';

export default function DashboardPage() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BsSpeedometer2,
      render: () => <AdminDashboard standalone={false} />,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BsGraphUp,
      render: () => <ReportsPage standalone={false} />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <TabNavigation tabs={tabs} defaultTab="overview" persistKey="admin-dashboard" />
      </div>
    </DashboardLayout>
  );
}
