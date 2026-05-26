import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);
  const [componentSettings, setComponentSettings] = useState({});
  const [userPreferences, setUserPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSettings = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/settings');
      const settingsMap = {};
      
      res.data.settings.forEach(setting => {
        let value = setting.setting_value;
        
        // Parse based on data_type
        if (setting.data_type === 'array') {
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.error(`Failed to parse setting ${setting.setting_key}:`, e);
          }
        } else if (setting.data_type === 'number') {
          value = Number(value);
        } else if (setting.data_type === 'boolean') {
          value = value === 'true';
        }
        
        settingsMap[setting.setting_key] = value;
      });
      
      setSettings(settingsMap);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch settings:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const res = await api.get('/settings/categories');
      setCategories(res.data.categories);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch categories:', err);
      }
    }
  };

  const refreshSettings = () => {
    fetchSettings();
    fetchCategories();
  };

  const fetchComponentSettings = async (component = null) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const url = component ? `/settings/components/${component}` : '/settings/components';
      const res = await api.get(url);
      setComponentSettings(prev => ({
        ...prev,
        ...res.data.settings,
      }));
    } catch (err) {
      // Handle 403/404 gracefully - component settings not accessible for this role
      if (err.response?.status === 403 || err.response?.status === 404) {
        // Use default settings when endpoint is not accessible
        return;
      }
      if (err.response?.status !== 401) {
        console.error('Failed to fetch component settings:', err);
      }
    }
  };

  const fetchUserPreferences = async () => {
    const token = localStorage.getItem('authToken');
    if (!token || !user?.id) return;
    try {
      const res = await api.get(`/settings/user/${user.id}`);
      setUserPreferences(res.data.preferences || {});
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch user preferences:', err);
      }
    }
  };

  const updateComponentSettings = async (component, settings) => {
    try {
      await api.put(`/settings/components/${component}`, { settings });
      // Update local state
      setComponentSettings(prev => ({
        ...prev,
        [component]: settings,
      }));
      return true;
    } catch (err) {
      console.error('Failed to update component settings:', err);
      return false;
    }
  };

  const updateUserPreferences = async (preferences) => {
    if (!user?.id) return false;
    try {
      await api.put(`/settings/user/${user.id}`, { preferences });
      setUserPreferences(preferences);
      return true;
    } catch (err) {
      console.error('Failed to update user preferences:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCategories();
    fetchComponentSettings();
    fetchUserPreferences();
  }, [user?.id]);

  const getSetting = (key, defaultValue = null) => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  const getDepartments = () => {
    return getSetting('DEPARTMENTS', ['Engineering', 'Product', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Support', 'Legal', 'Other']);
  };

  const getEmploymentTypes = () => {
    return getSetting('EMPLOYMENT_TYPES', ['Full-Time', 'Part-Time', 'Contract', 'Internship']);
  };

  const getLeaveTypes = () => {
    return getSetting('LEAVE_TYPES', ['annual', 'sick', 'maternity', 'paternity', 'unpaid']);
  };

  const getJobStatuses = () => {
    return getSetting('JOB_STATUSES', ['open', 'closed']);
  };

  const getPunchActions = () => {
    return getSetting('PUNCH_ACTIONS', ['checkIn', 'breakOut', 'breakIn', 'checkOut']);
  };

  const getComplaintStatuses = () => {
    return getSetting('COMPLAINT_STATUSES', ['open', 'acknowledged', 'investigating', 'resolved', 'closed']);
  };

  const getShiftTypes = () => {
    return getSetting('SHIFT_TYPES', ['Morning', 'Afternoon', 'Evening']);
  };

  const getEmploymentStatus = () => {
    return getSetting('EMPLOYMENT_STATUS', ['Full-time', 'Part-time', 'Contract', 'Self-employed', 'Intern', 'Freelance']);
  };

  const getApplicationStatus = () => {
    return getSetting('APPLICATION_STATUS', ['pending', 'shortlisted', 'rejected', 'hired', 'withdrawn']);
  };

  const getDailyLabourDepartments = () => {
    return getSetting('DAILY_LABOUR_DEPARTMENTS', ['farm', 'housekeeping', 'grounds', 'construction', 'kitchen', 'other']);
  };

  const getAttendanceLocations = () => {
    return getSetting('ATTENDANCE_LOCATIONS', []);
  };

  // Component settings helpers
  const getComponentSetting = (component, key, defaultValue = null) => {
    const compSettings = componentSettings[component] || {};
    const setting = compSettings[key];
    if (setting === undefined) return defaultValue;
    
    // Parse JSON value if needed
    if (typeof setting === 'string') {
      try {
        return JSON.parse(setting);
      } catch (e) {
        return setting;
      }
    }
    return setting;
  };

  const getUserPreference = (key, defaultValue = null) => {
    return userPreferences[key] !== undefined ? userPreferences[key] : defaultValue;
  };

  const value = {
    settings,
    categories,
    componentSettings,
    userPreferences,
    loading,
    refreshSettings,
    getSetting,
    getDepartments,
    getEmploymentTypes,
    getLeaveTypes,
    getJobStatuses,
    getPunchActions,
    getComplaintStatuses,
    getShiftTypes,
    getEmploymentStatus,
    getApplicationStatus,
    getDailyLabourDepartments,
    getAttendanceLocations,
    fetchComponentSettings,
    updateComponentSettings,
    fetchUserPreferences,
    updateUserPreferences,
    getComponentSetting,
    getUserPreference,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
