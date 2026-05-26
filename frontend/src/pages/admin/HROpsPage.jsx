import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import TabNavigation from '../../components/common/TabNavigation';
import { BsPersonCheck, BsClipboard, BsHandThumbsUp, BsClipboardCheck, BsPeople } from 'react-icons/bs';
import OnboardingPage from '../onboarding/index';
import JobPostingManagement from '../recruitment/JobPostingManagement';
import ShortlistPage from '../recruitment/ShortlistPage';
import AllApplicantsPage from '../recruitment/AllApplicantsPage';
import ComplaintsPage from '../complaints/index';

export default function HROpsPage() {
  const tabs = [
    {
      id: 'onboarding',
      label: 'Onboarding',
      icon: BsPersonCheck,
      render: () => <OnboardingPage standalone={false} />,
    },
    {
      id: 'recruitment',
      label: 'Recruitment',
      icon: BsClipboard,
      render: () => <JobPostingManagement standalone={false} />,
    },
    {
      id: 'shortlist',
      label: 'Shortlist',
      icon: BsClipboardCheck,
      render: () => <ShortlistPage standalone={false} />,
    },
    {
      id: 'all-applicants',
      label: 'All Applicants',
      icon: BsPeople,
      render: () => <AllApplicantsPage standalone={false} />,
    },
    {
      id: 'complaints',
      label: 'Complaints',
      icon: BsHandThumbsUp,
      render: () => <ComplaintsPage standalone={false} />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <TabNavigation tabs={tabs} defaultTab="onboarding" persistKey="admin-hr-ops" />
      </div>
    </DashboardLayout>
  );
}
