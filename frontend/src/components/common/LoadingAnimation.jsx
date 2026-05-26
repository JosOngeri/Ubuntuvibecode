import React from 'react';

// Skeleton loader for content structure
export const Skeleton = ({ className = '', variant = 'default', count = 1 }) => {
  const variants = {
    default: 'h-4 w-full',
    text: 'h-4 w-3/4',
    title: 'h-6 w-1/2',
    circle: 'h-12 w-12 rounded-full',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-lg',
    button: 'h-10 w-24 rounded',
  };

  const baseClass = variants[variant] || variants.default;

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${baseClass} ${className}`}
          style={{ animationDelay: `${index * 100}ms` }}
        />
      ))}
    </>
  );
};

// Skeleton loader for table rows
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 items-center">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant={colIndex === 0 ? 'circle' : 'text'}
              className={colIndex === 0 ? 'shrink-0' : ''}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Skeleton loader for cards grid
export const CardGridSkeleton = ({ cards = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <Skeleton variant="title" />
          <Skeleton variant="text" count={2} />
        </div>
      ))}
    </div>
  );
};

// Skeleton loader for tab content
export const TabContentSkeleton = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex gap-4 items-center mb-6">
        <Skeleton variant="avatar" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="title" />
          <Skeleton variant="text" />
        </div>
      </div>
      <Skeleton variant="card" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
};

// Spinner component for async operations
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div
      className={`border-2 border-slate-200 dark:border-slate-600 border-t-orange-500 rounded-full animate-spin ${sizes[size]} ${className}`}
    />
  );
};

// Progress bar for file uploads or loading progress
export const ProgressBar = ({ progress = 0, className = '' }) => {
  return (
    <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 ${className}`}>
      <div
        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};

// Combined skeleton + spinner for tab loading
export const TabLoading = () => {
  return (
    <div className="flex items-center justify-center gap-4 py-12">
      <Spinner size="lg" />
      <div className="space-y-2">
        <Skeleton variant="text" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
    </div>
  );
};

// Full page loading overlay
export const PageLoading = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 flex flex-col items-center justify-center z-50">
      <Spinner size="xl" className="mb-4" />
      <p className="text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  );
};

// Inline loading for small components
export const InlineLoading = ({ size = 'sm' }) => {
  return (
    <div className="flex items-center gap-2">
      <Spinner size={size} />
      <span className="text-sm text-slate-500 dark:text-slate-400">Loading...</span>
    </div>
  );
};

export default {
  Skeleton,
  TableSkeleton,
  CardGridSkeleton,
  TabContentSkeleton,
  Spinner,
  ProgressBar,
  TabLoading,
  PageLoading,
  InlineLoading,
};
