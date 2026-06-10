import React, { useState, useEffect, useRef } from 'react';
import DatePicker from './DatePicker';

export default function DateInput({
  label,
  value,
  onChange,
  required = false,
  placeholder = 'DD/MM/YYYY',
  name,
  id,
  error,
  validateOnSubmit = false,
  showValidation = false,
  disablePastDates = false,
  minAge = null,
  showCalendar = true,
}) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const isInternalChange = useRef(false);

  // Sync external value → display
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (!value) {
      setDisplayValue('');
      return;
    }
    const formatted = formatForDisplay(value);
    if (formatted) setDisplayValue(formatted);
  }, [value]);

  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  const formatForDisplay = dateStr => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts.every(p => /^\d+$/.test(p))) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return '';
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD for storage
  const parseFromDisplay = displayStr => {
    if (!displayStr || displayStr.length < 10) return '';
    const parts = displayStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (/^\d{2}$/.test(day) && /^\d{2}$/.test(month) && /^\d{4}$/.test(year)) {
        return `${year}-${month}-${day}`;
      }
    }
    return '';
  };

  // Convert YYYY-MM-DD to Date object for DatePicker
  const parseToDate = dateStr => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts.every(p => /^\d+$/.test(p))) {
      const [year, month, day] = parts.map(Number);
      const date = new Date(year, month - 1, day);
      if (date.getDate() === day && date.getMonth() === month - 1) return date;
    }
    return null;
  };

  const validateDate = dateStr => {
    if (!dateStr) return required ? 'Date is required' : null;

    // Parse YYYY-MM-DD format
    const parts = dateStr.split('-');
    if (parts.length !== 3 || !parts.every(p => /^\d+$/.test(p))) return 'Invalid date format';
    const [year, month, day] = parts;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    // Validate ranges
    if (dayNum < 1 || dayNum > 31) return 'Invalid day';
    if (monthNum < 1 || monthNum > 12) return 'Invalid month';
    if (yearNum < 1900 || yearNum > new Date().getFullYear() + 10) return 'Invalid year';

    // Check if date is valid (e.g., no Feb 30)
    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (date.getDate() !== dayNum || date.getMonth() !== monthNum - 1) {
      return 'Invalid date';
    }

    // Check if past dates are disabled
    if (disablePastDates) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(yearNum, monthNum - 1, dayNum);
      inputDate.setHours(0, 0, 0, 0);
      if (inputDate < today) {
        return 'Date cannot be in the past';
      }
    }

    // Check min age
    if (minAge !== null) {
      const today = new Date();
      const birthDate = new Date(yearNum, monthNum - 1, dayNum);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      const adjustedAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

      if (adjustedAge < minAge) return `Must be at least ${minAge} years old`;
    }

    return null;
  };

  const handleChange = e => {
    let rawValue = e.target.value;

    // Allow clearing completely
    if (!rawValue) {
      setDisplayValue('');
      isInternalChange.current = true;
      onChange({ target: { name, value: '' } });
      return;
    }

    // Remove any non-digit characters
    const digits = rawValue.replace(/\D/g, '');

    // Auto-format as DD/MM/YYYY
    let formatted = '';
    if (digits.length > 0) {
      formatted = digits.slice(0, 2);
    }
    if (digits.length > 2) {
      formatted += '/' + digits.slice(2, 4);
    }
    if (digits.length > 4) {
      formatted += '/' + digits.slice(4, 8);
    }

    setDisplayValue(formatted);

    // Only update parent when we have a complete, valid date
    if (formatted.length === 10) {
      const storageValue = parseFromDisplay(formatted);
      if (storageValue) {
        isInternalChange.current = true;
        onChange({ target: { name, value: storageValue } });
      }
    }
  };

  const handleBlur = e => {
    const rawValue = e.target.value;
    const storageValue = parseFromDisplay(rawValue);

    if (!storageValue) {
      // Incomplete or invalid on blur → clear everything
      setDisplayValue('');
      isInternalChange.current = true;
      onChange({ target: { name, value: '' } });
      return;
    }

    const validationError = validateDate(storageValue);
    if (validationError) {
      setDisplayValue('');
      isInternalChange.current = true;
      onChange({ target: { name, value: '' } });
    }
  };

  const handleDateSelect = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const storageValue = `${year}-${month}-${day}`;
    onChange({ target: { name, value: storageValue } });
    setShowDatePicker(false);
  };

  const storedError = showValidation ? validateDate(value) : error;
  const dateObject = parseToDate(value);

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && ' *'}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          id={id}
          name={name}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={10}
          className={`form-input w-full pr-10 ${storedError ? 'border-red-500' : ''}`}
          required={required}
        />
        {showCalendar && (
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#CB7246] transition-colors"
            title="Open calendar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
        )}
      </div>

      {showDatePicker && showCalendar && (
        <div className="absolute z-50 mt-1">
          <DatePicker
            selectedDate={dateObject}
            onDateChange={handleDateSelect}
            label=""
            showDay={true}
            yearRange={100}
            showHeader={false}
          />
        </div>
      )}

      {storedError && (
        <span className="text-sm text-red-600 dark:text-red-400 font-medium mt-1 block">
          {storedError}
        </span>
      )}
    </div>
  );
}
