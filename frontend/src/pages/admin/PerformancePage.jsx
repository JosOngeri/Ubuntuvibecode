import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import TabNavigation from '../../components/common/TabNavigation';
import { BsGraphUp, BsBook } from 'react-icons/bs';
import AdminKPI from './KPI';
import Training from './Training';

export default function PerformancePage() {
  const tabs = [
    {
      id: 'kpis',
      label: 'KPIs',
      icon: BsGraphUp,
      render: () => <AdminKPI standalone={false} />,
    },
    {
      id: 'training',
      label: 'Training & Development',
      icon: BsBook,
      render: () => <Training standalone={false} />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <TabNavigation tabs={tabs} defaultTab="kpis" persistKey="admin-performance" />
      </div>
    </DashboardLayout>
  );
}
