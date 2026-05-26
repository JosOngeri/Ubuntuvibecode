import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Settings as SettingsIcon, Save, Database, Activity, Wifi, Server, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

// Admin Settings page with connectivity tab
const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('settings');
  const [healthStatus, setHealthStatus] = useState({ database: 'unknown', api: 'unknown' });

  useEffect(() => {
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'logs') fetchLogs();
    if (activeTab === 'connectivity') fetchHealth();
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err) {
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/logs/activity');
      setLogs(res.data);
    } catch (err) {
      toast.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await api.get('/health/full');
      setHealthStatus({
        database: res.data.database || 'ok',
        api: res.data.status || 'ok',
      });
    } catch (err) {
      setHealthStatus({ database: 'error', api: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id, value) => {
    try {
      await api.put(`/settings/${id}`, { settingValue: value });
      toast.success('Setting saved');
      fetchSettings();
    } catch (err) {
      toast.error('Failed to save setting');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings & Logs</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <SettingsIcon size={18} />
          Settings
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            activeTab === 'logs' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <Activity size={18} />
          Activity Logs
        </button>
        <button
          onClick={() => setActiveTab('connectivity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            activeTab === 'connectivity' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <Wifi size={18} />
          Connectivity
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {settings.map((setting) => (
                  <tr key={setting.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{setting.settingKey}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{setting.category}</td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        defaultValue={setting.settingValue}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleSave(setting.id, setting.settingValue)}
                        className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        <Save size={16} />
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{log.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{log.action}</td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'connectivity' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">System Connectivity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <Database size={32} className={healthStatus.database === 'ok' ? 'text-green-600' : 'text-red-600'} />
                <div>
                  <p className="font-medium text-gray-800">Database</p>
                  <div className="flex items-center gap-2">
                    {healthStatus.database === 'ok' ? (
                      <>
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-green-600">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} className="text-red-600" />
                        <span className="text-red-600">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <Server size={32} className={healthStatus.api === 'ok' ? 'text-green-600' : 'text-red-600'} />
                <div>
                  <p className="font-medium text-gray-800">API Server</p>
                  <div className="flex items-center gap-2">
                    {healthStatus.api === 'ok' ? (
                      <>
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-green-600">Online</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} className="text-red-600" />
                        <span className="text-red-600">Offline</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Connection Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Database Host:</span>
                <span className="font-medium">localhost:5432</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Database Name:</span>
                <span className="font-medium">UbuntuRebuild1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">API Endpoint:</span>
                <span className="font-medium">http://localhost:5005/api</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frontend:</span>
                <span className="font-medium">http://localhost:3000</span>
              </div>
            </div>
          </div>

          <button
            onClick={fetchHealth}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Refresh Status
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;
