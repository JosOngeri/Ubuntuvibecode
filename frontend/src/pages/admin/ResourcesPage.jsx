import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import TabNavigation from '../../components/common/TabNavigation';
import { BsBox, BsFileText } from 'react-icons/bs';
import AssetsPage from '../assets/index';
import DocumentVault from './DocumentVault';

export default function ResourcesPage() {
  const tabs = [
    {
      id: 'assets',
      label: 'Assets',
      icon: BsBox,
      render: () => <AssetsPage standalone={false} />,
    },
    {
      id: 'documents',
      label: 'Document Vault',
      icon: BsFileText,
      render: () => <DocumentVault standalone={false} />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <TabNavigation tabs={tabs} defaultTab="assets" persistKey="admin-resources" />
      </div>
    </DashboardLayout>
  );
}
