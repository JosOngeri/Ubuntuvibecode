import React from 'react';

const FormContainer = ({
  children,
  title,
  description,
  onSubmit,
  loading = false,
  className = '',
  maxWidth = '2xl',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
  };

  return (
    <div className={`w-full ${maxWidthClasses[maxWidth] || maxWidthClasses['2xl']} ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
          )}
          {description && <p className="text-slate-600 dark:text-slate-400">{description}</p>}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {children}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        )}
      </form>
    </div>
  );
};

export default FormContainer;
