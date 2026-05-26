import React, { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const ProtectedRoute = ({ children, allowedRoles, requireAdminMode = false }) => {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [currentMode, setCurrentMode] = useState(null)
  const [modeLoading, setModeLoading] = useState(false)

  useEffect(() => {
    if (user && user.role === 'owner') {
      fetchCurrentMode()
    }
  }, [user])

  const fetchCurrentMode = async () => {
    try {
      setModeLoading(true)
      const response = await api.get('/roles/current-mode').catch(() => ({ data: { mode: null } }))
      setCurrentMode(response.data.mode)
    } catch (err) {
      console.error('Error fetching current mode:', err)
      setCurrentMode('owner') // Default to owner mode on error
    } finally {
      setModeLoading(false)
    }
  }

  if (loading || modeLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="w-48 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full animate-[loading-bar_1s_ease-in-out_infinite]"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role access
  let hasAccess = true
  if (allowedRoles) {
    // Owner can access everything, but if admin mode is required, check current mode
    if (user.role === 'owner') {
      if (requireAdminMode && currentMode !== 'admin') {
        hasAccess = false
      }
    } else if (!allowedRoles.includes(user.role)) {
      hasAccess = false
    }
  }

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
