import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  const { api } = useAuth()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPublicSettings()
  }, [])

  const fetchPublicSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/settings/public')
      setSettings(response.data.settings || {})
      setError(null)
    } catch (err) {
      console.error('Failed to fetch public settings:', err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const getSetting = (key, defaultValue = null) => {
    return settings[key] !== undefined ? settings[key] : defaultValue
  }

  const refreshSettings = () => {
    fetchPublicSettings()
  }

  const value = {
    settings,
    loading,
    error,
    getSetting,
    refreshSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
