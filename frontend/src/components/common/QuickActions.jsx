import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ actions, layout = 'grid' }) => {
  const { getComponentSetting } = useSettings();
  const navigate = useNavigate();

  // Get configurable settings
  const showBadges = getComponentSetting('QuickActions', 'showBadges', true);

  const handleActionClick = (action) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.route) {
      navigate(action.route);
    }
  };

  const layoutClasses = {
    grid: 'grid grid-cols-2 md:grid-cols-4 gap-4',
    flex: 'flex gap-4 overflow-x-auto',
    vertical: 'flex flex-col gap-2',
    row: 'flex flex-wrap gap-2',
  };

  return (
    <div className={layoutClasses[layout] || layoutClasses.grid}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        
        return (
          <button
            key={action.key || index}
            onClick={() => handleActionClick(action)}
            disabled={action.disabled}
            className={layout === 'row'
              ? `relative flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-sm transition-all group flex-1 min-w-[140px] ${
                  action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`
              : `relative p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-md transition-all group ${
                  action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
          >
            {/* Badge */}
            {showBadges && action.badge && action.badge > 0 && (
              <span className={`absolute bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold ${
                layout === 'row' ? '-top-1.5 -right-1.5' : '-top-2 -right-2'
              }`}>
                {action.badge}
              </span>
            )}

            {/* Icon */}
            {Icon && (
              <div className={`text-orange-500 group-hover:scale-110 transition-transform ${
                layout === 'row' ? '' : 'mx-auto mb-2'
              }`}>
                <Icon size={layout === 'row' ? 18 : 24} />
              </div>
            )}

            <div className={layout === 'row' ? 'flex flex-col items-start text-left' : ''}>
              {/* Label */}
              <div className={`font-medium text-slate-700 dark:text-slate-300 ${
                layout === 'row' ? 'text-xs' : 'text-sm text-center'
              }`}>
                {action.label}
              </div>

              {/* Description */}
              {action.description && (
                <div className={`text-slate-500 dark:text-slate-500 ${
                  layout === 'row' ? 'text-[10px] leading-tight' : 'text-xs text-center mt-1'
                }`}>
                  {action.description}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default QuickActions;
