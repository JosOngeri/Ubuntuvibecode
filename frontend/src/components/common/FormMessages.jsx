import React from 'react';
import { BsCheckCircle, BsExclamationCircle, BsInfoCircle, BsXCircle } from 'react-icons/bs';

const FormMessages = ({ success, error, info, onDismiss, className = '' }) => {
  if (!success && !error && !info) return null;

  const getMessageType = () => {
    if (success) return 'success';
    if (error) return 'error';
    if (info) return 'info';
    return null;
  };

  const type = getMessageType();

  const styles = {
    success:
      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
    error:
      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
  };

  const icons = {
    success: BsCheckCircle,
    error: BsExclamationCircle,
    info: BsInfoCircle,
  };

  const Icon = icons[type];

  return (
    <div className={`p-4 rounded-lg border flex items-start gap-3 ${styles[type]} ${className}`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">{success || error || info}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 hover:opacity-70 transition">
          <BsXCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default FormMessages;
