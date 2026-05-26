import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { BsBoxArrowRight, BsGear, BsPersonCircle, BsChevronDown, BsShieldCheck } from 'react-icons/bs'
import ThemeToggle from './ThemeToggle'
import headerImage from '../../assets/ubuntu-header-hrms.png'
import api from '../../services/api'
import { toast } from 'react-toastify'

const initialsFromName = (name) => {
  if (!name || name === 'Guest') return '?'
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const a = parts[0][0]
  const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1]
  return `${(a || '').toUpperCase()}${(b || '').toUpperCase()}`.trim() || '?'
}

const Header = ({ onToggleSidebar }) => {
  const { user, logout, displayName } = useAuth()
  const navigate = useNavigate()
  const avatarInitials = initialsFromName(displayName)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [currentMode, setCurrentMode] = useState(null)
  const [showModeSwitch, setShowModeSwitch] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [modeLoading, setModeLoading] = useState(false)
  const profileRef = useRef(null)
  const modeRef = useRef(null)

  // Fetch current mode for owner
  useEffect(() => {
    if (user?.role === 'owner') {
      fetchCurrentMode()
    }
  }, [user])

  const fetchCurrentMode = async () => {
    try {
      const response = await api.get('/roles/current-mode').catch(() => ({ data: { mode: null } }))
      setCurrentMode(response.data.mode)
    } catch (err) {
      console.error('Error fetching current mode:', err)
      setCurrentMode('owner')
    }
  }

  const switchMode = async (mode) => {
    if (mode === currentMode) return

    if (mode === 'admin' && !adminPassword) {
      setShowModeSwitch(true)
      return
    }

    try {
      setModeLoading(true)
      await api.post('/roles/switch-mode', {
        mode,
        adminPassword: mode === 'admin' ? adminPassword : null,
      })
      toast.success(`Switched to ${mode} mode`)
      setCurrentMode(mode)
      setShowModeSwitch(false)
      setAdminPassword('')
      window.location.reload()
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to switch mode')
    } finally {
      setModeLoading(false)
    }
  }

  const getDashboardPath = () => {
    if (!user?.role) return '/'

    switch (user.role.toLowerCase()) {
      case 'owner':
        return '/admin/dashboard'
      case 'admin':
        return '/admin/dashboard'
      case 'manager':
        return '/manager/dashboard'
      case 'supervisor':
        return '/manager/dashboard'
      case 'hr':
        return '/admin/dashboard'
      case 'employee':
        return '/employee/dashboard'
      case 'contractor':
        return '/contractor/dashboard'
      case 'daily_labourer':
        return '/daily-labour/dashboard'
      default:
        return '/dashboard'
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
      if (modeRef.current && !modeRef.current.contains(event.target)) {
        setShowModeSwitch(false)
        setAdminPassword('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileOpen, showModeSwitch])

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-900 transition-colors lg:hidden"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
          <div className="flex items-center">
            <Link to={getDashboardPath()} className="block">
              <img
                src={headerImage}
                alt="Ubuntu Eco Lodge HR Management System"
                className="h-11 w-auto object-contain"
              />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* Owner Mode Switch */}
          {user?.role === 'owner' && (
            <div className="relative" ref={modeRef}>
              <button
                onClick={() => setShowModeSwitch(!showModeSwitch)}
                disabled={modeLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                <BsShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {currentMode === 'admin' ? 'Admin Mode' : 'Owner Mode'}
                </span>
                <BsChevronDown className="w-3 h-3" />
              </button>

              {showModeSwitch && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">Switch Mode</p>
                  </div>
                  <button
                    onClick={() => switchMode('owner')}
                    disabled={modeLoading || currentMode === 'owner'}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                  >
                    <div className={`w-2 h-2 rounded-full ${currentMode === 'owner' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span className="text-sm">Owner Mode</span>
                  </button>
                  <button
                    onClick={() => switchMode('admin')}
                    disabled={modeLoading || currentMode === 'admin'}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                  >
                    <div className={`w-2 h-2 rounded-full ${currentMode === 'admin' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                    <span className="text-sm">Admin Mode</span>
                  </button>

                  {currentMode !== 'admin' && (
                    <div className="px-3 py-2 border-t border-slate-100">
                      <input
                        type="password"
                        placeholder="Admin password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-primary"
                        onKeyDown={(e) => e.key === 'Enter' && switchMode('admin')}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {avatarInitials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500 capitalize">
                {user?.role === 'owner' && currentMode === 'admin' ? 'Admin Mode' : user?.role || 'User'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
