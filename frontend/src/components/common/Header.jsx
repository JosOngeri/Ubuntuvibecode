import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { BsBoxArrowRight, BsGear, BsPersonCircle, BsChevronDown } from 'react-icons/bs'
import ThemeToggle from './ThemeToggle'
import headerImage from '../../assets/ubuntu-header-hrms.png'

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
  const profileRef = useRef(null)

  const getDashboardPath = () => {
    if (!user?.role) return '/'
    
    switch (user.role.toLowerCase()) {
      case 'admin':
        return '/admin/dashboard'
      case 'manager':
        return '/manager/dashboard'
      case 'supervisor':
        return '/supervisor/dashboard'
      case 'hr':
        return '/hr/dashboard'
      case 'employee':
        return '/employee/dashboard'
      case 'contractor':
        return '/contractor/dashboard'
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileOpen])

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
                className="h-7 w-auto object-contain"
              />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {avatarInitials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role || 'User'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
