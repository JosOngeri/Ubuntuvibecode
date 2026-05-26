import { useState, useEffect } from 'react'
import { Save, RefreshCw, Settings as SettingsIcon } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { FullPageLoading } from '../../components/common/Loading'
import SettingInput from '../../components/settings/SettingInput'
import SettingNumber from '../../components/settings/SettingNumber'
import SettingBoolean from '../../components/settings/SettingBoolean'
import SettingColor from '../../components/settings/SettingColor'
import SettingSelect from '../../components/settings/SettingSelect'
import SettingTextarea from '../../components/settings/SettingTextarea'

const SiteSettings = () => {
  const { user, api } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({})
  const [changes, setChanges] = useState({})
  const [activeCategory, setActiveCategory] = useState('general')

  const canManageSettings = user?.roles?.some(role => 
    ['Super Admin', 'Pastor', 'First Elder'].includes(role)
  )

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/settings')
      setSettings(response.data.settings || {})
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (category, key, value) => {
    setChanges(prev => ({
      ...prev,
      [key]: value
    }))
    setSettings(prev => ({
      ...prev,
      [category]: prev[category]?.map(s => 
        s.key === key ? { ...s, value } : s
      )
    }))
  }

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) {
      toast.info('No changes to save')
      return
    }

    try {
      setSaving(true)
      const settingsArray = Object.entries(changes).map(([key, value]) => ({
        key,
        value: String(value)
      }))

      await api.put('/settings/bulk', { settings: settingsArray })
      toast.success('Settings saved successfully')
      setChanges({})
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    fetchSettings()
    setChanges({})
    toast.info('Settings reset to server values')
  }

  const renderSetting = (setting) => {
    const currentValue = changes[setting.key] !== undefined ? changes[setting.key] : setting.value

    switch (setting.value_type) {
      case 'number':
        const rules = typeof setting.validation_rules === 'string' 
          ? JSON.parse(setting.validation_rules) 
          : setting.validation_rules
        return (
          <SettingNumber
            key={setting.key}
            label={setting.label}
            description={setting.description}
            value={currentValue}
            onChange={(value) => handleChange(setting.category, setting.key, value)}
            disabled={!setting.is_editable || !canManageSettings}
            min={rules?.min}
            max={rules?.max}
            step={rules?.step}
          />
        )
      case 'boolean':
        return (
          <SettingBoolean
            key={setting.key}
            label={setting.label}
            description={setting.description}
            value={currentValue === 'true' || currentValue === true}
            onChange={(value) => handleChange(setting.category, setting.key, value)}
            disabled={!setting.is_editable || !canManageSettings}
          />
        )
      case 'color':
        return (
          <SettingColor
            key={setting.key}
            label={setting.label}
            description={setting.description}
            value={currentValue}
            onChange={(value) => handleChange(setting.category, setting.key, value)}
            disabled={!setting.is_editable || !canManageSettings}
          />
        )
      case 'select':
        const selectRules = typeof setting.validation_rules === 'string' 
          ? JSON.parse(setting.validation_rules) 
          : setting.validation_rules
        const options = selectRules?.enum?.map(val => ({ value: val, label: val })) || []
        return (
          <SettingSelect
            key={setting.key}
            label={setting.label}
            description={setting.description}
            value={currentValue}
            onChange={(value) => handleChange(setting.category, setting.key, value)}
            options={options}
            disabled={!setting.is_editable || !canManageSettings}
          />
        )
      default:
        return (
          <SettingInput
            key={setting.key}
            label={setting.label}
            description={setting.description}
            value={currentValue}
            onChange={(value) => handleChange(setting.category, setting.key, value)}
            disabled={!setting.is_editable || !canManageSettings}
          />
        )
    }
  }

  const categoryNames = {
    general: 'General',
    appearance: 'Appearance',
    contact: 'Contact Information',
    social: 'Social Media',
    payment: 'Payment Settings',
    sms: 'SMS Settings',
    service: 'Service Times',
    features: 'Feature Flags'
  }

  if (loading) {
    return <FullPageLoading />
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-600">Manage site-wide configuration</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(changes).length === 0 || !canManageSettings}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {Object.keys(settings).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  activeCategory === category
                    ? 'bg-green-100 text-green-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  {categoryNames[category] || category}
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {categoryNames[activeCategory] || activeCategory}
            </h2>
            
            {settings[activeCategory] && settings[activeCategory].length > 0 ? (
              <div className="space-y-6">
                {settings[activeCategory].map(renderSetting)}
              </div>
            ) : (
              <p className="text-gray-500">No settings in this category</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SiteSettings
