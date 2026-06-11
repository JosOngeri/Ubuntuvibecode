import React from 'react';
import { BsBriefcase, BsBoxArrowRight } from 'react-icons/bs';
import TabNavigation from './TabNavigation';
import StatsCards from './StatsCards';
import QuickActions from './QuickActions';

const DashboardShell = ({
  title,
  subtitle,
  role,
  icon: IconComponent = BsBriefcase,
  tabs,
  statsCards,
  quickActions,
  loading,
  error,
  onRetry,
  persistKey,
  children,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <BsBoxArrowRight className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Failed to Load Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>

      {tabs?.length > 0 ? (
        <TabNavigation tabs={tabs} persistKey={persistKey || `${role}-dashboard`} />
      ) : (
        children
      )}
    </div>
  );
};

export default DashboardShell;
