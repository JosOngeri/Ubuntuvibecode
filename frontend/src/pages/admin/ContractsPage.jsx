import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import TabNavigation from '../../components/common/TabNavigation';
import { BsFileEarmarkText, BsCheckCircle, BsBriefcase } from 'react-icons/bs';
import AdminContract from './Contract';
import ContractReview from '../contracts/Review';
import ContractorsPage from '../contractors/index';

export default function ContractsPage() {
  const tabs = [
    {
      id: 'contracts',
      label: 'Contracts',
      icon: BsFileEarmarkText,
      render: () => <AdminContract standalone={false} />,
    },
    {
      id: 'review',
      label: 'Review Submissions',
      icon: BsCheckCircle,
      render: () => <ContractReview standalone={false} />,
    },
    {
      id: 'contractors',
      label: 'Contractors',
      icon: BsBriefcase,
      render: () => <ContractorsPage standalone={false} />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <TabNavigation tabs={tabs} defaultTab="contracts" persistKey="admin-contracts" />
      </div>
    </DashboardLayout>
  );
}
