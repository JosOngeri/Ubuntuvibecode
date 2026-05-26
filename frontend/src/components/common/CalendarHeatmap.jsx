import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const CalendarHeatmap = ({ attendance, dateJoined, months = 3 }) => {
  const [hoveredDay, setHoveredDay] = useState(null);
  const { getComponentSetting } = useSettings();

  // Get configurable settings with defaults
  const colorScheme = getComponentSetting('CalendarHeatmap', 'colorScheme', {
    present: '#10b981',
    late: '#f59e0b',
    absent: '#94a3b8',
    leave: '#f43f5e',
  });

  const showLegend = getComponentSetting('CalendarHeatmap', 'showLegend', true);

  // Get date range
  const today = new Date();
  const monthsToShow = months;
  const monthsArray = [];
  
  for (let i = monthsToShow - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthsArray.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      name: date.toLocaleDateString('en-US', { month: 'short' }),
    });
  }

  // Create attendance map for quick lookup
  const attendanceMap = {};
  attendance.forEach(record => {
    const date = new Date(record.attendanceDate || record.date);
    const key = date.toISOString().split('T')[0];
    attendanceMap[key] = record;
  });

  // Generate calendar days for a month
  const generateMonthDays = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const days = [];
    
    // Add empty cells for days before the 1st
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const record = attendanceMap[dateStr];
      
      // Determine if this is a future date or before employment
      const isFuture = date > today;
      const isBeforeEmployment = dateJoined && date < new Date(dateJoined);
      
      days.push({
        day,
        date: dateStr,
        record,
        isFuture,
        isBeforeEmployment
      });
    }
    
    return days;
  };

  const getStatusColor = (record, isFuture, isBeforeEmployment) => {
    if (isFuture || isBeforeEmployment) return 'bg-slate-100';
    if (!record) return 'bg-slate-200';
    
    const status = record.status?.toLowerCase();
    switch (status) {
      case 'present':
        return colorScheme.present;
      case 'late':
        return colorScheme.late;
      case 'absent':
        return colorScheme.absent;
      case 'leave':
        return colorScheme.leave;
      default:
        return 'bg-slate-200';
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderMonth = (monthData) => {
    const days = generateMonthDays(monthData.year, monthData.month);
    
    return (
      <div className="flex-1 min-w-[200px]">
        <h4 className="text-lg font-semibold text-slate-900 mb-3 text-center dark:text-white">
          {monthData.name} {monthData.year}
        </h4>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs text-slate-500 font-medium dark:text-slate-400">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((dayData, index) => (
            <div key={index} className="aspect-square">
              {dayData ? (
                <div
                  className={`w-full h-full rounded flex items-center justify-center text-sm font-medium cursor-pointer transition-all hover:scale-110 hover:ring-2 hover:ring-orange-400 ${getStatusColor(dayData.record, dayData.isFuture, dayData.isBeforeEmployment)} ${dayData.record ? 'text-white' : 'text-slate-600'}`}
                  onMouseEnter={() => setHoveredDay(dayData)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {dayData.day}
                </div>
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Calculate stats
  const calculateStats = () => {
    const allDays = monthsArray.flatMap(m => generateMonthDays(m.year, m.month))
      .filter(d => d && !d.isFuture && !d.isBeforeEmployment);
    
    const total = allDays.length;
    const present = allDays.filter(d => d.record?.status?.toLowerCase() === 'present').length;
    const late = allDays.filter(d => d.record?.status?.toLowerCase() === 'late').length;
    const absent = allDays.filter(d => !d.record && !d.isFuture && !d.isBeforeEmployment).length;
    const onLeave = allDays.filter(d => d.record?.status?.toLowerCase() === 'leave').length;
    
    return { 
      total, 
      present, 
      late, 
      absent, 
      onLeave, 
      rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0 
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Days</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.present}</div>
          <div className="text-sm text-emerald-600 dark:text-emerald-400">Present</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.late}</div>
          <div className="text-sm text-amber-600 dark:text-amber-400">Late</div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.onLeave}</div>
          <div className="text-sm text-rose-600 dark:text-rose-400">On Leave</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.rate}%</div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Attendance Rate</div>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-x-auto">
        {monthsArray.map(monthData => renderMonth(monthData))}
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.present }} />
            <span className="text-sm text-slate-600 dark:text-slate-400">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.late }} />
            <span className="text-sm text-slate-600 dark:text-slate-400">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.leave }} />
            <span className="text-sm text-slate-600 dark:text-slate-400">Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.absent }} />
            <span className="text-sm text-slate-600 dark:text-slate-400">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-200" />
            <span className="text-sm text-slate-600 dark:text-slate-400">No Data</span>
          </div>
        </div>
      )}
      
      {/* Tooltip */}
      {hoveredDay && hoveredDay.record && (
        <div className="fixed z-50 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm" style={{ left: '50%', transform: 'translateX(-50%)', bottom: '20px' }}>
          <div className="font-semibold">{new Date(hoveredDay.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div>Status: <span className="capitalize">{hoveredDay.record.status}</span></div>
          {hoveredDay.record.checkIn && <div>Check-in: {new Date(hoveredDay.record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>}
          {hoveredDay.record.checkOut && <div>Check-out: {new Date(hoveredDay.record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>}
          {hoveredDay.record.totalHoursWorked && <div>Hours: {hoveredDay.record.totalHoursWorked.toFixed(2)}</div>}
        </div>
      )}
    </div>
  );
};

export default CalendarHeatmap;
