/**
 * Modal Component
 * Reusable modal component with overlay
 */

import { useEffect } from 'react';
import clsx from 'clsx';

const Modal = ({ isOpen, onClose, children, className, ...props }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      {...props}
    >
      <div className="fixed inset-0 bg-black bg-opacity-50" />
      <div
        className={clsx('relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4', className)}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
