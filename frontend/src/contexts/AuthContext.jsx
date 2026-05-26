import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import api from '../services/api'

const AuthContext = createContext()

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const normalizeProfileName = (raw = {}) => {
  const full = raw.fullName ?? raw.fullname
  return typeof full === 'string' ? full.trim() : ''
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [portalDisplayName, setPortalDisplayName] = useState('')
  const [additionalRoles, setAdditionalRoles] = useState([])
  const [supervisorAllocations, setSupervisorAllocations] = useState([])
  const [departmentHeadAssignment, setDepartmentHeadAssignment] = useState(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [adminModeExpiresAt, setAdminModeExpiresAt] = useState(null)

  const refreshPortalProfile = useCallback(async () => {
    const t = localStorage.getItem('authToken')
    if (!t) {
      setPortalDisplayName('')
      return
    }
    try {
      const res = await api.get('/profile/me').catch(() => ({ data: null }))
      const name = normalizeProfileName(res.data || {})
      setPortalDisplayName(name)
    } catch {
      setPortalDisplayName('')
    }
  }, [])

  const decodeToken = (jwtToken) => {
    try {
      const payload = jwtToken.split('.')[1]
      if (!payload) return null

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
      const decoded = JSON.parse(atob(padded))
      return decoded
    } catch {
      return null
    }
  }

  // Fetch additional roles and allocations from backend
  const fetchUserRolesAndAllocations = useCallback(async (userId) => {
    if (!userId) return
    try {
      // Fetch supervisor allocations
      const superRes = await api.get('/supervisor-allocations/me/supervisees').catch(() => ({ data: { data: [] } }))
      setSupervisorAllocations(superRes.data?.data || [])

      // Fetch department head assignment
      const deptRes = await api.get('/department-heads/me').catch(() => ({ data: { data: null } }))
      setDepartmentHeadAssignment(deptRes.data?.data || null)

      // Determine additional roles
      const roles = []
      if (superRes.data?.data?.length > 0) roles.push('supervisor')
      if (deptRes.data?.data) roles.push('department_head')
      setAdditionalRoles(roles)
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }, [])

  // Admin mode functions for Owner role
  const enableAdminMode = useCallback((durationMinutes = 10) => {
    if (user?.role !== 'owner') return false
    
    const expiresAt = new Date(Date.now() + durationMinutes * 60000)
    setIsAdminMode(true)
    setAdminModeExpiresAt(expiresAt)
    
    // Set timeout to auto-disable
    setTimeout(() => {
      setIsAdminMode(false)
      setAdminModeExpiresAt(null)
    }, durationMinutes * 60000)
    
    return true
  }, [user])

  const disableAdminMode = useCallback(() => {
    setIsAdminMode(false)
    setAdminModeExpiresAt(null)
  }, [])

  const isAdminModeActive = useCallback(() => {
    if (!isAdminMode || !adminModeExpiresAt) return false
    return new Date() < new Date(adminModeExpiresAt)
  }, [isAdminMode, adminModeExpiresAt])

  // Helper functions for checking roles
  const isSupervisor = useCallback(() => {
    return additionalRoles.includes('supervisor') || supervisorAllocations.length > 0
  }, [additionalRoles, supervisorAllocations])

  const isDepartmentHead = useCallback(() => {
    return additionalRoles.includes('department_head') || !!departmentHeadAssignment
  }, [additionalRoles, departmentHeadAssignment])

  const getSupervisedEmployees = useCallback(() => {
    return supervisorAllocations.map(a => a.superviseeId)
  }, [supervisorAllocations])

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    if (savedToken) {
      const decoded = decodeToken(savedToken)
      console.log('[AuthContext] Decoded token on load:', decoded)
      if (decoded) {
        setToken(savedToken)
        setUser(decoded)
        axios.defaults.headers.common['x-auth-token'] = savedToken
        refreshPortalProfile()
        fetchUserRolesAndAllocations(decoded.id)
      } else {
        localStorage.removeItem('authToken')
        delete axios.defaults.headers.common['x-auth-token']
      }
    }
    setLoading(false)
  }, [refreshPortalProfile, fetchUserRolesAndAllocations])

  // Check admin mode expiry periodically
  useEffect(() => {
    if (!isAdminMode || !adminModeExpiresAt) return
    
    const interval = setInterval(() => {
      if (new Date() >= new Date(adminModeExpiresAt)) {
        setIsAdminMode(false)
        setAdminModeExpiresAt(null)
      }
    }, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [isAdminMode, adminModeExpiresAt])

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password,
      })
      const { token, mustChangePassword, resetToken, msg } = response.data

      if (mustChangePassword) {
        return {
          mustChangePassword: true,
          resetToken,
          msg,
        }
      }

      setToken(token)
      axios.defaults.headers.common['x-auth-token'] = token
      localStorage.setItem('authToken', token)
      
      // Decode token to get user info
      const decoded = decodeToken(token)
      if (!decoded) {
        throw new Error('Invalid auth token received')
      }
      setUser(decoded)
      console.log('[AuthContext] Decoded token after login:', decoded)
      await refreshPortalProfile()
      await fetchUserRolesAndAllocations(decoded.id)
      
      return {
        mustChangePassword: false,
        user: decoded,
      }
    } catch (error) {
      throw error.response?.data?.msg || 'Login failed'
    }
  }

  const register = async (username, password, role) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        username,
        password,
        role,
      })
      const { token } = response.data
      setToken(token)
      axios.defaults.headers.common['x-auth-token'] = token
      localStorage.setItem('authToken', token)
      
      const decoded = decodeToken(token)
      if (!decoded) {
        throw new Error('Invalid auth token received')
      }
      setUser(decoded)
      await refreshPortalProfile()
      await fetchUserRolesAndAllocations(decoded.id)
      
      return decoded
    } catch (error) {
      throw error.response?.data?.msg || 'Registration failed'
    }
  }

  const forgotPassword = async (email) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email,
      })
      return response.data
    } catch (error) {
      throw error.response?.data?.msg || 'Failed to process forgot password request'
    }
  }

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token,
        newPassword,
      })
      return response.data
    } catch (error) {
      throw error.response?.data?.msg || 'Failed to reset password'
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setPortalDisplayName('')
    setAdditionalRoles([])
    setSupervisorAllocations([])
    setDepartmentHeadAssignment(null)
    setIsAdminMode(false)
    setAdminModeExpiresAt(null)
    localStorage.removeItem('authToken')
    delete axios.defaults.headers.common['x-auth-token']
  }

  const displayName = useMemo(
    () => portalDisplayName || user?.name || user?.username || 'Guest',
    [portalDisplayName, user]
  )

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register,
      forgotPassword,
      resetPassword,
      logout,
      portalDisplayName,
      refreshPortalProfile,
      displayName,
      additionalRoles,
      supervisorAllocations,
      departmentHeadAssignment,
      isAdminMode,
      adminModeExpiresAt,
      enableAdminMode,
      disableAdminMode,
      isAdminModeActive,
      isSupervisor,
      isDepartmentHead,
      getSupervisedEmployees,
      fetchUserRolesAndAllocations,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
