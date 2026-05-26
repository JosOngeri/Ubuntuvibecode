import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import TabNavigation from '../../components/common/TabNavigation';
import StatsCards from '../../components/common/StatsCards';
import DataTable from '../../components/common/DataTable';
import api from '../../services/api';
import { 
  BsGeoAlt, BsShieldCheck, BsGear, BsClockHistory, BsPalette, BsBuilding, BsPeople, 
  BsFileText, BsBriefcase, BsSun, BsClipboardCheck, BsHammer, BsPersonBadge,
  BsBell, BsLock, BsPlug, BsGrid, BsDatabase, BsImage
} from 'react-icons/bs';

const AdminSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshSettings, getComponentSetting, updateComponentSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Office location state
  const [officeLocation, setOfficeLocation] = useState({
    latitude: -1.19293,
    longitude: 36.93057,
    radius_meters: 1000,
    name: 'Main Office',
  });

  // Employees state
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [canSelfRecord, setCanSelfRecord] = useState(true);

  // System settings state
  const [systemSettings, setSystemSettings] = useState({});
  const [editingSetting, setEditingSetting] = useState(null);

  // Component settings state
  const [componentSettings, setComponentSettings] = useState({});

  // Audit log state
  const [auditLogs, setAuditLogs] = useState([]);

  // System logs state
  const [systemLogs, setSystemLogs] = useState([]);
  const [systemLogStats, setSystemLogStats] = useState([]);
  const [systemLogsLoaded, setSystemLogsLoaded] = useState(false);
  const [auditLogsLoaded, setAuditLogsLoaded] = useState(false);

  // Favicon state
  const [favicons, setFavicons] = useState([]);
  const [activeFavicon, setActiveFavicon] = useState(null);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'owner') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch office location
      const locResponse = await api.get('/api/settings/location/office').catch(() => ({ data: {} }));
      if (locResponse.data.location) {
        setOfficeLocation(locResponse.data.location);
      }

      // Fetch employees
      const empResponse = await api.get('/api/settings/attendance/employees').catch(() => ({ data: {} }));
      if (empResponse.data.employees) {
        setEmployees(empResponse.data.employees);
      }

      // Fetch system settings
      const settingsResponse = await api.get('/settings').catch(() => ({ data: { settings: [] } }));
      if (settingsResponse.data.settings) {
        const settingsMap = {};
        settingsResponse.data.settings.forEach(setting => {
          let value = setting.setting_value;
          if (setting.data_type === 'array') {
            try {
              value = JSON.parse(value);
            } catch (e) {
              console.error(`Failed to parse setting ${setting.setting_key}:`, e);
            }
          }
          settingsMap[setting.setting_key] = { ...setting, parsedValue: value };
        });
        setSystemSettings(settingsMap);
      }

      // Fetch component settings
      const compResponse = await api.get('/settings/components').catch(() => ({ data: { settings: {} } }));
      if (compResponse.data.settings) {
        setComponentSettings(compResponse.data.settings);
      }

      // Fetch favicons
      const faviconResponse = await api.get('/favicons').catch(() => ({ data: [] }));
      if (faviconResponse.data) {
        setFavicons(faviconResponse.data);
      }

      // Fetch active favicon
      const activeResponse = await api.get('/favicons/active').catch(() => ({ data: null }));
      if (activeResponse.data) {
        setActiveFavicon(activeResponse.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (auditLogsLoaded) return;
    try {
      const response = await api.get('/api/system-logs').catch(() => ({ data: { logs: [] } }));
      // Filter for audit-relevant events only
      const filteredLogs = (response.data.logs || []).filter(log => 
        log.module === 'auth' || 
        log.module === 'settings' || 
        log.module === 'employees' || 
        log.module === 'users' ||
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(log.metadata?.method)
      );
      setAuditLogs(filteredLogs);
      setAuditLogsLoaded(true);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      toast.error('Failed to load audit logs');
    }
  };

  const fetchSystemLogs = async () => {
    if (systemLogsLoaded) return;
    try {
      const response = await api.get('/api/system-logs').catch(() => ({ data: { logs: [] } }));
      setSystemLogs(response.data.logs || []);
      setSystemLogsLoaded(true);
    } catch (err) {
      console.error('Error fetching system logs:', err);
      toast.error('Failed to load system logs');
    }
  };

  const fetchSystemLogStats = async () => {
    if (systemLogsLoaded) return;
    try {
      const response = await api.get('/api/system-logs/stats').catch(() => ({ data: { stats: [] } }));
      setSystemLogStats(response.data.stats || []);
    } catch (err) {
      console.error('Error fetching system log stats:', err);
    }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await api.put('/api/settings/location/office', officeLocation);
      toast.success('Office location updated successfully');
    } catch (err) {
      console.error('Error updating location:', err);
      toast.error(err.response?.data?.msg || 'Failed to update location');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateSetting = async (e) => {
    e.preventDefault();
    if (!editingSetting) return;

    try {
      setUpdating(true);
      const { setting_value, reason } = editingSetting;
      await api.put(`/settings/${editingSetting.setting_key}`, { setting_value, reason });
      toast.success('Setting updated successfully');
      setEditingSetting(null);
      fetchData();
      refreshSettings();
    } catch (err) {
      console.error('Error updating setting:', err);
      toast.error(err.response?.data?.msg || 'Failed to update setting');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateComponentSetting = async (component, settings) => {
    try {
      setUpdating(true);
      await api.put(`/settings/components/${component}`, { settings });
      toast.success('Component settings updated successfully');
      fetchData();
    } catch (err) {
      console.error('Error updating component settings:', err);
      toast.error(err.response?.data?.msg || 'Failed to update component settings');
    } finally {
      setUpdating(false);
    }
  };

  const handleUploadFavicon = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('favicon', file);

    try {
      setUploadingFavicon(true);
      const response = await api.post('/favicons/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Favicon uploaded successfully');
      fetchData();
    } catch (err) {
      console.error('Error uploading favicon:', err);
      toast.error(err.response?.data?.error || 'Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
      e.target.value = '';
    }
  };

  const handleSetDefaultFavicon = async (variant) => {
    try {
      setUpdating(true);
      await api.post('/favicons/default', { variant });
      toast.success('Default favicon set successfully');
      fetchData();
    } catch (err) {
      console.error('Error setting default favicon:', err);
      toast.error(err.response?.data?.error || 'Failed to set default favicon');
    } finally {
      setUpdating(false);
    }
  };

  const handleSetActiveFavicon = async (id) => {
    try {
      setUpdating(true);
      await api.put(`/favicons/${id}/activate`);
      toast.success('Favicon activated successfully');
      fetchData();
    } catch (err) {
      console.error('Error activating favicon:', err);
      toast.error(err.response?.data?.error || 'Failed to activate favicon');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteFavicon = async (id) => {
    if (!confirm('Are you sure you want to delete this favicon?')) return;

    try {
      setUpdating(true);
      await api.delete(`/favicons/${id}`);
      toast.success('Favicon deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Error deleting favicon:', err);
      toast.error(err.response?.data?.error || 'Failed to delete favicon');
    } finally {
      setUpdating(false);
    }
  };

  // Define tabs
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BsGrid,
      render: () => renderOverviewTab(),
    },
    {
      id: 'system',
      label: 'System',
      icon: BsGear,
      render: () => renderSystemTab(),
    },
    {
      id: 'components',
      label: 'Components',
      icon: BsGrid,
      render: () => renderComponentsTab(),
    },
    {
      id: 'location',
      label: 'Location',
      icon: BsGeoAlt,
      render: () => renderLocationTab(),
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: BsShieldCheck,
      render: () => renderPermissionsTab(),
    },
    {
      id: 'audit',
      label: 'Audit Log',
      icon: BsClockHistory,
      onLoad: fetchAuditLogs,
      render: () => renderAuditTab(),
    },
    {
      id: 'system-logs',
      label: 'System Logs',
      icon: BsDatabase,
      onLoad: () => { fetchSystemLogs(); fetchSystemLogStats(); },
      render: () => renderSystemLogsTab(),
    },
    {
      id: 'favicon',
      label: 'Favicon',
      icon: BsImage,
      render: () => renderFaviconTab(),
    },
  ];

  const renderOverviewTab = () => {
    const stats = [
      { key: 'employees', label: 'Total Employees', value: employees.length, icon: BsPeople, trend: 5 },
      { key: 'settings', label: 'System Settings', value: Object.keys(systemSettings).length, icon: BsGear },
      { key: 'components', label: 'Component Settings', value: Object.keys(componentSettings).length, icon: BsGrid },
      { key: 'audit', label: 'Recent Changes', value: auditLogs.length, icon: BsClockHistory },
    ];

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">System Overview</h2>
          <p className="text-orange-100">Quick summary of your HRMS configuration</p>
        </div>

        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={() => navigate('/employees')} className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                Manage Employees
              </button>
              <button onClick={() => navigate('/attendance')} className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                View Attendance
              </button>
              <button onClick={() => navigate('/payroll')} className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                Process Payroll
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Office Location</h3>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">Name:</span> {officeLocation.name}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">Coordinates:</span> {officeLocation.latitude}, {officeLocation.longitude}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">Radius:</span> {officeLocation.radius_meters}m
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSystemTab = () => {
    const settingGroups = [
      { key: 'DEPARTMENTS', label: 'Departments', icon: BsBuilding },
      { key: 'EMPLOYMENT_TYPES', label: 'Employment Types', icon: BsBriefcase },
      { key: 'LEAVE_TYPES', label: 'Leave Types', icon: BsFileText },
      { key: 'SHIFT_TYPES', label: 'Shift Types', icon: BsSun },
      { key: 'EMPLOYMENT_STATUS', label: 'Employment Status', icon: BsClipboardCheck },
      { key: 'APPLICATION_STATUS', label: 'Application Status', icon: BsFileText },
      { key: 'DAILY_LABOUR_DEPARTMENTS', label: 'Daily Labour Depts', icon: BsHammer },
    ];

    return (
      <div className="space-y-6">
        {settingGroups.map(group => (
          <div key={group.key} className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <group.icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{group.label}</h3>
            </div>
            {renderSystemSettingsContent(group.key)}
          </div>
        ))}
      </div>
    );
  };

  const renderComponentsTab = () => {
    const components = [
      { id: 'CalendarHeatmap', label: 'Calendar Heatmap', description: 'Attendance visualization settings' },
      { id: 'TabNavigation', label: 'Tab Navigation', description: 'Dashboard tab behavior' },
      { id: 'StatsCards', label: 'Stats Cards', description: 'Statistics card appearance' },
      { id: 'DataTable', label: 'Data Table', description: 'Table display and pagination' },
      { id: 'FilterBar', label: 'Filter Bar', description: 'Search and filter options' },
      { id: 'QuickActions', label: 'Quick Actions', description: 'Action button configuration' },
    ];

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Component Settings</h2>
          <p className="text-blue-100">Configure global component behavior and appearance</p>
        </div>

        {components.map(comp => (
          <div key={comp.id} className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{comp.label}</h3>
                <p className="text-sm text-slate-500">{comp.description}</p>
              </div>
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                Configure
              </button>
            </div>
            <div className="text-sm text-slate-500">
              Component ID: <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{comp.id}</code>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLocationTab = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <BsGeoAlt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Office Location</h2>
          <p className="text-sm text-slate-500">Configure office location and attendance radius</p>
        </div>
      </div>
      
      <form onSubmit={handleUpdateLocation} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Office Name</label>
          <input
            type="text"
            value={officeLocation.name}
            onChange={(e) => setOfficeLocation({ ...officeLocation, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
            placeholder="e.g., Main Office"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
            <input
              type="number"
              step="0.00001"
              value={officeLocation.latitude}
              onChange={(e) => setOfficeLocation({ ...officeLocation, latitude: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
              placeholder="-1.19293"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
            <input
              type="number"
              step="0.00001"
              value={officeLocation.longitude}
              onChange={(e) => setOfficeLocation({ ...officeLocation, longitude: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
              placeholder="36.93057"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Allowed Radius (meters)</label>
          <input
            type="number"
            value={officeLocation.radius_meters}
            onChange={(e) => setOfficeLocation({ ...officeLocation, radius_meters: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
            placeholder="1000"
          />
        </div>

        <button type="submit" disabled={updating} className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50">
          {updating ? 'Updating...' : 'Update Location Settings'}
        </button>
      </form>
    </div>
  );

  const renderPermissionsTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <BsShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Employee Permissions</h2>
            <p className="text-sm text-slate-500">Manage employee attendance recording permissions</p>
          </div>
        </div>

        <DataTable
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'type', label: 'Type', sortable: true },
            { key: 'department', label: 'Department', sortable: true },
            { key: 'permission', label: 'Can Self-Record', sortable: true, render: (val) => (
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${val ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {val ? '✓ Yes' : '✗ No'}
              </span>
            )},
          ]}
          data={employees.map(emp => ({
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            type: emp.employment_type,
            department: emp.department,
            permission: emp.can_self_record_attendance,
          }))}
        />
      </div>
    </div>
  );

  const renderAuditTab = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <BsClockHistory className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Audit Log</h2>
          <p className="text-sm text-slate-500">History of all user actions and system events</p>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'level', label: 'Level', sortable: true },
          { key: 'message', label: 'Message', sortable: true },
          { key: 'module', label: 'Module', sortable: true },
          { key: 'action', label: 'Action', sortable: true },
          { key: 'changes', label: 'Changes', sortable: true },
          { key: 'username', label: 'User', sortable: true },
          { key: 'created_at', label: 'Timestamp', sortable: true },
        ]}
        data={auditLogs.map(log => {
          const metadata = log.metadata || {};
          const body = metadata.body || {};
          
          // Show old/new values if available, otherwise show body changes
          let changes = '-';
          if (metadata.old_value !== undefined || metadata.new_value !== undefined) {
            changes = `Before: ${JSON.stringify(metadata.old_value)} → After: ${JSON.stringify(metadata.new_value)}`;
          } else {
            changes = Object.entries(body)
              .filter(([key]) => key !== 'password' && key !== 'confirmPassword')
              .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
              .join(', ') || '-';
          }
          
          return {
            id: log.id,
            level: (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                log.level === 'error' ? 'bg-red-100 text-red-700' :
                log.level === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                log.level === 'info' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {log.level}
              </span>
            ),
            message: log.message,
            module: log.module || '-',
            action: log.action || '-',
            changes: (
              <div className="max-w-md truncate text-xs" title={changes}>
                {changes}
              </div>
            ),
            username: log.username || log.email || 'System',
            created_at: new Date(log.created_at).toLocaleString(),
          };
        })}
      />
    </div>
  );

  const renderSystemLogsTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <BsDatabase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Logs</h2>
            <p className="text-sm text-slate-500">Application-wide event logging and monitoring</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {systemLogStats.map(stat => (
            <div key={stat.level} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.count}</div>
              <div className="text-sm text-slate-500 capitalize">{stat.level}</div>
            </div>
          ))}
        </div>

        <DataTable
          columns={[
            { key: 'level', label: 'Level', sortable: true },
            { key: 'message', label: 'Message', sortable: true },
            { key: 'module', label: 'Module', sortable: true },
            { key: 'action', label: 'Action', sortable: true },
            { key: 'username', label: 'User', sortable: true },
            { key: 'ip_address', label: 'IP Address', sortable: true },
            { key: 'created_at', label: 'Timestamp', sortable: true },
          ]}
          data={systemLogs.map(log => ({
            id: log.id,
            level: (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                log.level === 'error' ? 'bg-red-100 text-red-700' :
                log.level === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                log.level === 'info' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {log.level}
              </span>
            ),
            message: log.message,
            module: log.module || '-',
            action: log.action || '-',
            username: log.username || log.email || 'System',
            ip_address: log.ip_address || '-',
            created_at: new Date(log.created_at).toLocaleString(),
          }))}
        />
      </div>
    </div>
  );

  const renderFaviconTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <BsImage className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Favicon Management</h2>
            <p className="text-sm text-slate-500">Manage your application's favicon</p>
          </div>
        </div>

        {/* Current Active Favicon */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Current Active Favicon</h3>
          {activeFavicon && (
            <div className="flex items-center gap-4">
              <img 
                src={activeFavicon.type === 'default' ? activeFavicon.path : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${activeFavicon.path}`}
                alt="Current Favicon"
                className="w-16 h-16 object-contain border border-slate-300 dark:border-slate-600 rounded"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {activeFavicon.type === 'default' ? 'Default Favicon' : 'Custom Favicon'}
                </p>
                <p className="text-xs text-slate-500">{activeFavicon.filename}</p>
              </div>
            </div>
          )}
        </div>

        {/* Default Favicons */}
        <div className="mb-6">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Default Favicons</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-orange-500 transition cursor-pointer"
                 onClick={() => handleSetDefaultFavicon('1')}>
              <img src="/favicon-1.png" alt="Favicon 1" className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm text-center text-slate-600 dark:text-slate-400">Favicon 1</p>
              {activeFavicon?.filename === 'favicon-1.png' && (
                <p className="text-xs text-center text-green-600 mt-1">Active</p>
              )}
            </div>
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-orange-500 transition cursor-pointer"
                 onClick={() => handleSetDefaultFavicon('2')}>
              <img src="/favicon-2.png" alt="Favicon 2" className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm text-center text-slate-600 dark:text-slate-400">Favicon 2</p>
              {activeFavicon?.filename === 'favicon-2.png' && (
                <p className="text-xs text-center text-green-600 mt-1">Active</p>
              )}
            </div>
          </div>
        </div>

        {/* Upload Custom Favicon */}
        <div className="mb-6">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Upload Custom Favicon</h3>
          <div className="p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
            <input
              type="file"
              accept=".png,.ico"
              onChange={handleUploadFavicon}
              disabled={uploadingFavicon}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
            <p className="text-xs text-slate-500 mt-2">Supported formats: PNG, ICO. Maximum size: 1MB</p>
          </div>
        </div>

        {/* Custom Favicons List */}
        {favicons.filter(f => f.type === 'custom').length > 0 && (
          <div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Custom Favicons</h3>
            <div className="space-y-3">
              {favicons.filter(f => f.type === 'custom').map(favicon => (
                <div key={favicon.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <img 
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${favicon.path}`}
                      alt={favicon.originalName}
                      className="w-12 h-12 object-contain border border-slate-300 dark:border-slate-600 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{favicon.originalName}</p>
                      <p className="text-xs text-slate-500">Uploaded: {new Date(favicon.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {favicon.isActive ? (
                      <span className="text-xs text-green-600 font-medium">Active</span>
                    ) : (
                      <button
                        onClick={() => handleSetActiveFavicon(favicon.id)}
                        disabled={updating}
                        className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition disabled:opacity-50"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteFavicon(favicon.id)}
                      disabled={updating || favicon.isActive}
                      className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSystemSettingsContent = (settingKey) => {
    const setting = systemSettings[settingKey];
    if (!setting) {
      return <p className="text-slate-500 dark:text-slate-400">No settings found</p>;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="flex-1">
            <p className="font-medium text-slate-900 dark:text-slate-100">{setting.setting_key}</p>
            <p className="text-sm text-slate-500">{setting.description}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {Array.isArray(setting.parsedValue) ? setting.parsedValue.join(', ') : setting.parsedValue}
            </p>
          </div>
          <button
            onClick={() => setEditingSetting({ ...setting, setting_value: setting.setting_value })}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Edit
          </button>
        </div>

        {editingSetting && editingSetting.setting_key === settingKey && (
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900">
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Edit Setting: {editingSetting.setting_key}</h3>
            <form onSubmit={handleUpdateSetting} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Value</label>
                {editingSetting.data_type === 'array' ? (
                  <textarea
                    value={editingSetting.setting_value}
                    onChange={(e) => setEditingSetting({ ...editingSetting, setting_value: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg mt-1"
                    rows="4"
                    placeholder='["value1", "value2", "value3"]'
                  />
                ) : (
                  <input
                    type="text"
                    value={editingSetting.setting_value}
                    onChange={(e) => setEditingSetting({ ...editingSetting, setting_value: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg mt-1"
                  />
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason for change</label>
                <input
                  type="text"
                  value={editingSetting.reason || ''}
                  onChange={(e) => setEditingSetting({ ...editingSetting, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg mt-1"
                  placeholder="Why are you changing this value?"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={updating} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50">
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingSetting(null)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <BsGear className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-sm text-slate-500">Manage system configuration and preferences</p>
          </div>
        </div>

        <TabNavigation tabs={tabs} persistKey="admin-settings" />
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
