import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import TabNavigation from '../../components/common/TabNavigation';
import {
  BsPeople,
  BsPersonCircle,
  BsGear,
  BsDiagram3,
  BsPersonGear,
  BsBuilding,
} from 'react-icons/bs';
import AdminEmployees from './Employees';
import AdminUsers from './Users';
import Permissions from './Permissions';
import OrgChart from './OrgChart';
import SupervisorAllocations from './SupervisorAllocations';
import DepartmentHeadAssignments from './DepartmentHeadAssignments';

export default function PeoplePage() {
  const tabs = [
    {
      id: 'employees',
      label: 'Employees',
      icon: BsPeople,
      render: () => <AdminEmployees standalone={false} />,
    },
    {
      id: 'users',
      label: 'Users',
      icon: BsPersonCircle,
      render: () => <AdminUsers standalone={false} />,
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: BsGear,
      render: () => <Permissions standalone={false} />,
    },
    {
      id: 'org-chart',
      label: 'Org Chart',
      icon: BsDiagram3,
      render: () => <OrgChart standalone={false} />,
    },
    {
      id: 'supervisor-allocations',
      label: 'Supervisor Allocations',
      icon: BsPersonGear,
      render: () => <SupervisorAllocations standalone={false} />,
    },
    {
      id: 'department-heads',
      label: 'Department Heads',
      icon: BsBuilding,
      render: () => <DepartmentHeadAssignments standalone={false} />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <TabNavigation tabs={tabs} defaultTab="employees" persistKey="admin-people" />
      </div>
    </DashboardLayout>
  );
}
