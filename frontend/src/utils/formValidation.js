// Form validation rules and utilities

export const validationRules = {
  required: value => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    return null;
  },

  email: value => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  phone: value => {
    if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  minLength: min => value => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: max => value => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },

  numeric: value => {
    if (value && isNaN(Number(value))) {
      return 'Please enter a valid number';
    }
    return null;
  },

  positiveNumber: value => {
    if (value !== null && value !== undefined && value !== '' && Number(value) <= 0) {
      return 'Please enter a positive number';
    }
    return null;
  },

  min: min => value => {
    if (value !== null && value !== undefined && value !== '' && Number(value) < min) {
      return `Must be at least ${min}`;
    }
    return null;
  },

  max: max => value => {
    if (value !== null && value !== undefined && value !== '' && Number(value) > max) {
      return `Must be no more than ${max}`;
    }
    return null;
  },

  pattern: (regex, message) => value => {
    if (value && !regex.test(value)) {
      return message || 'Invalid format';
    }
    return null;
  },

  date: value => {
    if (value && isNaN(Date.parse(value))) {
      return 'Please enter a valid date';
    }
    return null;
  },

  url: value => {
    if (value && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value)) {
      return 'Please enter a valid URL';
    }
    return null;
  },
};

export const validateField = (value, rules) => {
  if (!rules || rules.length === 0) return null;

  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }

  return null;
};

export const validateForm = (formData, schema) => {
  const errors = {};
  let isValid = true;

  for (const field in schema) {
    const fieldRules = schema[field];
    const error = validateField(formData[field], fieldRules);

    if (error) {
      errors[field] = error;
      isValid = false;
    }
  }

  return { errors, isValid };
};
