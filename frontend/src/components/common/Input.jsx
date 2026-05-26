import React from 'react'
import { cn } from '../../lib/utils'

const Input = React.forwardRef(
  (
    {
      label,
      error,
      size = 'md',
      className = '',
      type = 'text',
      autocomplete,
      id,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    }

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          id={id}
          autoComplete={autocomplete}
          className={cn(
            'w-full rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none transition-all duration-200',
            sizeClasses[size] || sizeClasses.md,
            error
              ? 'border-red-500 dark:border-red-600 focus:border-red-900 dark:focus:border-red-400'
              : 'border-slate-300 dark:border-slate-600 focus:border-slate-900 dark:focus:border-slate-100',
            className
          )}
          {...props}
          onInput={(e) => {
            // Allow AI form fillers to work by calling onChange if value differs
            if (props.onChange && e.target.value !== props.value) {
              props.onChange(e);
            }
          }}
        />
        {error && (
          <span className="text-sm text-red-600 dark:text-red-400 font-medium">
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
