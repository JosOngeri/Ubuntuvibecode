import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  BsSpeedometer2,
  BsPeople,
  BsClipboard,
  BsCreditCard,
  BsGraphUp,
  BsCalendarCheck,
  BsCalendarX,
  BsCheckCircle,
  BsFileText,
  BsGear,
  BsPersonCheck,
  BsHandThumbsUp,
  BsPersonCircle,
  BsClipboardCheck,
  BsBriefcase,
  BsBox,
  BsFileEarmarkText,
  BsBullseye,
  BsCloudUpload,
  BsChevronLeft,
  BsChevronRight,
  BsChevronDown,
  BsBoxArrowRight,
  BsDiagram3,
  BsBook,
  BsPersonGear,
  BsBuilding,
  BsChatDots
} from 'react-icons/bs'


const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, logout, displayName } = useAuth()
  const role = user?.role
  const [collapsedGroups, setCollapsedGroups] = useState({})

  const initialsFromName = (name) => {
    if (!name || name === 'Guest') return '?'
    const parts = String(name).trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return '?'
    const a = parts[0][0]
    const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1]
    return `${(a || '').toUpperCase()}${(b || '').toUpperCase()}`.trim() || '?'
  }

  const avatarInitials = initialsFromName(displayName)

  const toggleGroup = (title) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  const getMenuGroups = () => {
    const recruitmentItems = [
      { path: '/recruitment/jobs', label: 'Recruitment', icon: BsClipboard },
    ];

    if (role === 'admin') return [
      {
        title: 'Dashboard',
        priority: 1,
        items: [
          { path: '/admin/dashboard', label: 'Dashboard', icon: BsSpeedometer2 },
        ]
      },
      {
        title: 'People',
        priority: 2,
        items: [
          { path: '/admin/people', label: 'People', icon: BsPeople },
        ]
      },
      {
        title: 'Attendance',
        priority: 3,
        items: [
          { path: '/admin/attendance', label: 'Attendance', icon: BsClipboardCheck },
        ]
      },
      {
        title: 'Payroll',
        priority: 4,
        items: [
          { path: '/admin/payroll', label: 'Payroll', icon: BsCreditCard },
        ]
      },
      {
        title: 'Performance',
        priority: 5,
        items: [
          { path: '/admin/performance', label: 'Performance', icon: BsGraphUp },
          { path: '/admin/training', label: 'Training', icon: BsBook },
        ]
      },
      {
        title: 'Contracts',
        priority: 6,
        items: [
          { path: '/admin/contracts', label: 'Contracts', icon: BsFileEarmarkText },
        ]
      },
      {
        title: 'HR Operations',
        priority: 7,
        items: [
          { path: '/admin/hr-ops', label: 'HR Operations', icon: BsPersonCheck },
          { path: '/recruitment/shortlist', label: 'Shortlist', icon: BsClipboardCheck },
          { path: '/recruitment/applicants', label: 'All Applicants', icon: BsPeople },
        ]
      },
      {
        title: 'Organisation',
        priority: 8,
        items: [
          { path: '/admin/org-chart', label: 'Org Chart', icon: BsDiagram3 },
          { path: '/admin/supervisor-allocations', label: 'Supervisor Allocations', icon: BsPersonGear },
          { path: '/admin/department-head-assignments', label: 'Dept Heads', icon: BsBuilding },
          { path: '/admin/documents', label: 'Document Vault', icon: BsFileText },
        ]
      },
      {
        title: 'Resources',
        priority: 9,
        items: [
          { path: '/admin/resources', label: 'Resources', icon: BsBox },
        ]
      },
      {
        title: 'Communications',
        priority: 10,
        items: [
          { path: '/messages', label: 'Messages', icon: BsChatDots },
        ]
      },
      {
        title: 'Settings',
        priority: 11,
        items: [
          { path: '/admin/settings', label: 'Settings', icon: BsGear },
        ]
      },
    ];

    if (role === 'manager' || role === 'supervisor') return [
      {
        title: 'Dashboard',
        priority: 1,
        items: [
          { path: '/manager/dashboard', label: 'Dashboard', icon: BsSpeedometer2 },
        ]
      },
      {
        title: 'People',
        priority: 2,
        items: [
          { path: '/admin/people', label: 'People', icon: BsPeople },
        ]
      },
      {
        title: 'Attendance',
        priority: 3,
        items: [
          { path: '/manager/attendance', label: 'Attendance', icon: BsClipboardCheck },
        ]
      },
      {
        title: 'Performance',
        priority: 4,
        items: [
          { path: '/kpi/manage', label: 'Performance', icon: BsGraphUp },
        ]
      },
      {
        title: 'Contracts',
        priority: 5,
        items: [
          { path: '/admin/contracts', label: 'Contracts', icon: BsFileEarmarkText },
        ]
      },
      {
        title: 'Operations',
        priority: 6,
        items: [
          { path: '/admin/onboarding', label: 'Onboarding', icon: BsPersonCheck },
          { path: '/admin/daily-labour', label: 'Daily Labour', icon: BsPeople },
          { path: '/admin/complaints', label: 'Complaints', icon: BsHandThumbsUp },
        ]
      },
      {
        title: 'Resources',
        priority: 7,
        items: [
          { path: '/admin/assets', label: 'Assets', icon: BsBox },
          { path: '/admin/contractors', label: 'Contractors', icon: BsBriefcase },
        ]
      },
      {
        title: 'Reports',
        priority: 8,
        items: [
          { path: '/admin/reports', label: 'Reports', icon: BsGraphUp },
        ]
      },
      {
        title: 'Hiring',
        priority: 9,
        items: recruitmentItems,
      },
      {
        title: 'Communications',
        priority: 10,
        items: [
          { path: '/messages', label: 'Messages', icon: BsChatDots },
        ]
      }
    ].sort((a, b) => a.priority - b.priority);

    if (role === 'employee') return [
      {
        title: 'Dashboard',
        priority: 1,
        items: [
          { path: '/employee/dashboard', label: 'Dashboard', icon: BsSpeedometer2 },
        ]
      },
      {
        title: 'Attendance',
        priority: 2,
        items: [
          { path: '/employee/punch', label: 'Punch In/Out', icon: BsPersonCheck },
          { path: '/employee/attendance', label: 'My Attendance', icon: BsClipboardCheck },
          { path: '/employee/leaves', label: 'My Leaves', icon: BsCalendarCheck },
          { path: '/leave/request', label: 'Request Leave', icon: BsCalendarX },
        ]
      },
      {
        title: 'Payroll',
        priority: 3,
        items: [
          { path: '/payroll/payslips', label: 'My Payslips', icon: BsFileText },
        ]
      },
      {
        title: 'Performance',
        priority: 4,
        items: [
          { path: '/kpi/my-goals', label: 'My Goals', icon: BsBullseye },
        ]
      },
      {
        title: 'Complaints',
        priority: 5,
        items: [
          { path: '/admin/complaints', label: 'Complaints', icon: BsHandThumbsUp },
        ]
      },
      {
        title: 'Jobs',
        priority: 6,
        items: [
          { path: '/recruitment/jobs-board', label: 'Job Board', icon: BsClipboard },
          { path: '/recruitment/my-applications', label: 'My Applications', icon: BsFileText },
        ]
      },
      {
        title: 'Communications',
        priority: 7,
        items: [
          { path: '/messages', label: 'Messages', icon: BsChatDots },
        ]
      }
    ].sort((a, b) => a.priority - b.priority);

    if (role === 'contractor') return [
      {
        title: 'Overview',
        priority: 1,
        items: [
          { path: '/contractor/dashboard', label: 'Dashboard', icon: BsSpeedometer2 },
        ]
      },
      {
        title: 'Projects',
        priority: 2,
        items: [
          { path: '/contractor/projects', label: 'Projects', icon: BsBriefcase },
        ]
      },
      {
        title: 'Milestones',
        priority: 3,
        items: [
          { path: '/contractor/portal', label: 'Submit Milestones', icon: BsCloudUpload },
        ]
      },
      {
        title: 'Invoices',
        priority: 4,
        items: [
          { path: '/contractor/invoices', label: 'Invoices', icon: BsFileEarmarkText },
        ]
      },
      {
        title: 'KPIs',
        priority: 5,
        items: [
          { path: '/contractor/reports', label: 'My KPI', icon: BsGraphUp },
        ]
      },
      {
        title: 'Communications',
        priority: 6,
        items: [
          { path: '/messages', label: 'Messages', icon: BsChatDots },
        ]
      }
    ].sort((a, b) => a.priority - b.priority);

    if (role === 'daily_labourer') return [
      {
        title: 'Overview',
        priority: 1,
        items: [
          { path: '/daily-labour/dashboard', label: 'Dashboard', icon: BsSpeedometer2 },
        ]
      },
      {
        title: 'Attendance',
        priority: 2,
        items: [
          { path: '/daily-labour/attendance', label: 'My Attendance', icon: BsClipboardCheck },
        ]
      },
      {
        title: 'Payments',
        priority: 3,
        items: [
          { path: '/daily-labour/payments', label: 'Payments', icon: BsFileText },
        ]
      },
      {
        title: 'Communications',
        priority: 4,
        items: [
          { path: '/messages', label: 'Messages', icon: BsChatDots },
        ]
      }
    ].sort((a, b) => a.priority - b.priority);

    return [
      {
        title: 'Overview',
        priority: 1,
        items: [
          { path: '/dashboard', label: 'Dashboard', icon: BsSpeedometer2 },
        ]
      }
    ];
  };

  const menuGroups = getMenuGroups();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={onClose}
        />
      )}
      
      <aside className={`fixed lg:static left-0 top-16 h-[calc(100vh-64px)] ${isCollapsed ? 'w-20' : 'w-64'} bg-[#1a1a2e] border-r border-slate-800 transform transition-all duration-300 z-40 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* User Profile at top */}
        {!isCollapsed && (
          <NavLink
            to="/profile/view"
            className="p-4 border-b border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                {avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-400 capitalize">{role || 'User'}</p>
              </div>
            </div>
          </NavLink>
        )}
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-hide">
          <nav className="flex flex-col gap-1 px-3">
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="flex flex-col">
                {/* Subtle section divider */}
                {!isCollapsed && groupIdx > 0 && (
                  <div className="border-t border-slate-700 my-3 mx-2" />
                )}
                
                {/* Items */}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                        isActive
                          ? 'bg-orange-500 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                      onClick={onClose}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon size={20} className="min-w-[20px]" />
                      {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
        
        {/* Logout button at bottom */}
        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <BsBoxArrowRight size={20} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
        
        {/* Collapse toggle */}
        <div className="p-2 border-t border-slate-700 flex justify-center hidden lg:flex">
          <button 
            onClick={onToggleCollapse} 
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center justify-center w-full"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <BsChevronRight size={18} /> : <BsChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
