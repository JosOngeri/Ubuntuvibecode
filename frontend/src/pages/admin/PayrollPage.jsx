import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import TabNavigation from '../../components/common/TabNavigation';
import { BsCreditCard, BsFileText } from 'react-icons/bs';
import AdminPayroll from './Payroll';
// import PayrollDisburse from '../payroll/Disburse';

export default function AdminPayrollPage() {
  const tabs = [
    {
      id: 'management',
      label: 'Payroll Management',
      icon: BsCreditCard,
      render: () => <AdminPayroll standalone={false} />,
    },
    // {
    //   id: 'disburse',
    //   label: 'Disburse Payroll',
    //   icon: BsFileText,
    //   render: () => <PayrollDisburse standalone={false} />,
    // },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <TabNavigation tabs={tabs} defaultTab="management" persistKey="admin-payroll" />
      </div>
    </DashboardLayout>
  );
}
