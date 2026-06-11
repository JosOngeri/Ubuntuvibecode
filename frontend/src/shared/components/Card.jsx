/**
 * Card Component
 * Reusable card component for content containers
 */

import clsx from 'clsx';

const Card = ({ children, className, padding = 'md', ...props }) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-sm border border-gray-200',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
