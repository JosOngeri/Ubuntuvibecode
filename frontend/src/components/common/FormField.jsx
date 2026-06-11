import React from 'react';

const FormField = ({ label, name, error, touched, required = false, helpText, children }) => {
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {children}

      {helpText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helpText}</p>
      )}

      {error && touched && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default FormField;
