import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { BsFunnel, BsX, BsCalendar, BsSearch } from 'react-icons/bs';

const FilterBar = ({
  filters = [],
  onFilterChange = null,
  showPresets = true,
  presets = [],
  onPresetSelect = null,
}) => {
  const { getComponentSetting } = useSettings();

  // Get configurable settings
  const showPresetsSetting = getComponentSetting('FilterBar', 'showPresets', true);

  const [activeFilters, setActiveFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [showCustomFilter, setShowCustomFilter] = useState(null);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleRemoveFilter = key => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleClearAll = () => {
    setActiveFilters({});
    setSearchQuery('');
    setDateRange({ start: null, end: null });
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const handlePresetSelect = preset => {
    setActiveFilters(preset.filters);
    if (onPresetSelect) {
      onPresetSelect(preset);
    }
    if (onFilterChange) {
      onFilterChange(preset.filters);
    }
  };

  const activeFilterCount =
    Object.keys(activeFilters).length + (searchQuery ? 1 : 0) + (dateRange.start ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              if (onFilterChange) {
                onFilterChange({ ...activeFilters, search: e.target.value });
              }
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2">
          <BsCalendar className="text-slate-400" />
          <input
            type="date"
            value={dateRange.start || ''}
            onChange={e => {
              const newRange = { ...dateRange, start: e.target.value };
              setDateRange(newRange);
              if (onFilterChange) {
                onFilterChange({ ...activeFilters, dateRange: newRange });
              }
            }}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={dateRange.end || ''}
            onChange={e => {
              const newRange = { ...dateRange, end: e.target.value };
              setDateRange(newRange);
              if (onFilterChange) {
                onFilterChange({ ...activeFilters, dateRange: newRange });
              }
            }}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowCustomFilter(showCustomFilter === null ? 'all' : null)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            activeFilterCount > 0
              ? 'bg-orange-500 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          <BsFunnel />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-white text-orange-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Preset Filters */}
      {showPresetsSetting && showPresets && presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetSelect(preset)}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Custom Filter Panel */}
      {showCustomFilter && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Custom Filters</h3>
            <button
              onClick={() => setShowCustomFilter(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <BsX size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map(filter => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {filter.label}
                </label>
                {filter.type === 'select' ? (
                  <select
                    value={activeFilters[filter.key] || ''}
                    onChange={e => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">All</option>
                    {filter.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : filter.type === 'multiselect' ? (
                  <div className="space-y-1">
                    {filter.options.map(option => (
                      <label key={option.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={(activeFilters[filter.key] || []).includes(option.value)}
                          onChange={e => {
                            const current = activeFilters[filter.key] || [];
                            const newValues = e.target.checked
                              ? [...current, option.value]
                              : current.filter(v => v !== option.value);
                            handleFilterChange(filter.key, newValues);
                          }}
                          className="rounded border-slate-300 dark:border-slate-600"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                ) : filter.type === 'date' ? (
                  <input
                    type="date"
                    value={activeFilters[filter.key] || ''}
                    onChange={e => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                ) : (
                  <input
                    type="text"
                    value={activeFilters[filter.key] || ''}
                    onChange={e => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm"
                  >
                    {filters.find(f => f.key === key)?.label || key}: {String(value)}
                    <button
                      onClick={() => handleRemoveFilter(key)}
                      className="hover:text-orange-900 dark:hover:text-orange-100"
                    >
                      <BsX size={14} />
                    </button>
                  </div>
                ))}
                {searchQuery && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                    Search: {searchQuery}
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        handleRemoveFilter('search');
                      }}
                      className="hover:text-orange-900 dark:hover:text-orange-100"
                    >
                      <BsX size={14} />
                    </button>
                  </div>
                )}
                {dateRange.start && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                    Date Range
                    <button
                      onClick={() => {
                        setDateRange({ start: null, end: null });
                        handleRemoveFilter('dateRange');
                      }}
                      className="hover:text-orange-900 dark:hover:text-orange-100"
                    >
                      <BsX size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
