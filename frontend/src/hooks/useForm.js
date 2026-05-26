import { useState, useEffect, useCallback } from 'react';
import { validateField, validateForm } from '../utils/formValidation';

export const useForm = (initialValues, validationSchema, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues(initialValues);
  }, [JSON.stringify(initialValues)]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;
    const newValue = type === 'checkbox' ? checked : type === 'file' ? files[0] : value;
    
    setValues(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field on blur if validation schema exists
    if (validationSchema && validationSchema[name]) {
      const error = validateField(values[name], validationSchema[name]);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [values, validationSchema]);

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  const validateAll = useCallback(() => {
    if (!validationSchema) {
      return { isValid: true, errors: {} };
    }

    const result = validateForm(values, validationSchema);
    setErrors(result.errors);
    return result;
  }, [values, validationSchema]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const { isValid, errors: validationErrors } = validateAll();
    
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateAll, onSubmit]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    validateAll,
    resetForm,
    handleSubmit,
  };
};
