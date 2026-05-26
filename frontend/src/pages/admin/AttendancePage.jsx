import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import TabNavigation from '../../components/common/TabNavigation';
import {
  BsClipboardCheck,
  BsCalendarCheck,
  BsFileEarmarkText,
  BsPeople,
} from 'react-icons/bs';
import AttendancePage from '../shared/Attendance';
import AdminLeave from './Leave';
import LeaveStatutory from '../leave/Statutory';
import DailyLabourPage from '../dailyLabour/index';

export default function AdminAttendancePage() {
  const tabs = [
    {
      id: 'attendance',
      label: 'Attendance',
      icon: BsClipboardCheck,
      render: () => <AttendancePage role="admin" standalone={false} />,
    },
    {
      id: 'leaves',
      label: 'Leave & Off-days',
      icon: BsCalendarCheck,
      render: () => <AdminLeave standalone={false} />,
    },
    {
      id: 'statutory',
      label: 'Statutory Review',
      icon: BsFileEarmarkText,
      render: () => <LeaveStatutory standalone={false} />,
    },
    {
      id: 'daily-labour',
      label: 'Daily Labour',
      icon: BsPeople,
      render: () => <DailyLabourPage standalone={false} />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <TabNavigation tabs={tabs} defaultTab="attendance" persistKey="admin-attendance" />
      </div>
    </DashboardLayout>
  );
}
