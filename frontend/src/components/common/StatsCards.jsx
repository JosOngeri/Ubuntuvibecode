import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { BsArrowUp, BsArrowDown, BsDash } from 'react-icons/bs';

const StatsCards = ({ stats, layout = 'grid', onClick = null }) => {
  const { getComponentSetting } = useSettings();

  // Get configurable settings
  const gradientEnabled = getComponentSetting('StatsCards', 'gradientEnabled', true);
  const showTrends = getComponentSetting('StatsCards', 'showTrends', true);

  const getGradientClass = (index) => {
    if (!gradientEnabled) return 'bg-slate-50 dark:bg-slate-800';
    
    const gradients = [
      'bg-gradient-to-br from-orange-400 to-orange-600',
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-emerald-400 to-emerald-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-cyan-400 to-cyan-600',
    ];
    
    return gradients[index % gradients.length];
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <BsArrowUp className="text-emerald-500" />;
    if (trend < 0) return <BsArrowDown className="text-rose-500" />;
    return <BsDash className="text-slate-400" />;
  };

  const getTrendClass = (trend) => {
    if (trend > 0) return 'text-emerald-500';
    if (trend < 0) return 'text-rose-500';
    return 'text-slate-400';
  };

  const layoutClasses = {
    grid: 'grid grid-cols-2 md:grid-cols-4 gap-4',
    flex: 'flex gap-4 overflow-x-auto',
  };

  return (
    <div className={layoutClasses[layout] || layoutClasses.grid}>
      {stats.map((stat, index) => (
        <div
          key={stat.key || index}
          onClick={() => onClick && onClick(stat)}
          className={`relative p-4 rounded-lg transition-all hover:scale-105 hover:shadow-lg cursor-pointer ${gradientEnabled ? getGradientClass(index) : 'bg-slate-50 dark:bg-slate-800'}`}
        >
          {/* Trend Indicator */}
          {showTrends && stat.trend !== undefined && (
            <div className="absolute top-2 right-2 flex items-center gap-1 text-sm font-medium">
              {getTrendIcon(stat.trend)}
              <span className={getTrendClass(stat.trend)}>
                {Math.abs(stat.trend)}%
              </span>
            </div>
          )}

          {/* Icon */}
          {stat.icon && (
            <div className={`mb-2 ${gradientEnabled ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
              <stat.icon size={24} />
            </div>
          )}

          {/* Value */}
          <div className={`text-2xl font-bold ${gradientEnabled ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {stat.value}
          </div>

          {/* Label */}
          <div className={`text-sm ${gradientEnabled ? 'text-white/80' : 'text-slate-600 dark:text-slate-400'}`}>
            {stat.label}
          </div>

          {/* Description */}
          {stat.description && (
            <div className={`text-xs mt-1 ${gradientEnabled ? 'text-white/60' : 'text-slate-500 dark:text-slate-500'}`}>
              {stat.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
