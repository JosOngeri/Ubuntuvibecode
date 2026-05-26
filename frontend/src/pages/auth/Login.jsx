import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ToastContainer, toast } from 'react-toastify'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { BsPersonCircle, BsEye, BsEyeSlash, BsArrowRepeat } from 'react-icons/bs'
import './Auth.css'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [preloading, setPreloading] = useState(false)
  const [preloadProgress, setPreloadProgress] = useState(0)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let interval;
    if (preloading) {
      interval = setInterval(() => {
        setPreloadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 1
        })
      }, 40) // 40ms * 100 = 4000ms total
    }
    return () => clearInterval(interval)
  }, [preloading])

  const validateForm = () => {
    const newErrors = {}
    
    if (!username.trim()) {
      newErrors.username = 'Username is required'
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const result = await login(username, password)

      if (result.mustChangePassword) {
        toast.info(result.msg || 'Please change your password to continue')
        setTimeout(() => {
          navigate(`/reset-password?token=${result.resetToken}`)
        }, 500)
        return
      }

      const user = result.user
      toast.success('Login successful')
      
      setLoading(false)
      setPreloading(true)

      // Preload dashboard and pages one click away based on role
      setTimeout(() => {
        const dashboardRoute = user.role === 'admin' 
          ? '/admin/dashboard'
          : user.role === 'manager' || user.role === 'supervisor'
          ? '/manager/dashboard'
          : user.role === 'employee'
          ? '/employee/dashboard'
          : user.role === 'daily_labourer'
          ? '/daily-labour/dashboard'
          : '/contractor/dashboard'
        
        navigate(dashboardRoute)
      }, 4000)
    } catch (error) {
      toast.error(error)
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <ToastContainer position="top-right" />
      
      <div className="auth-card">
        {preloading ? (
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/ubuntu-logo-with-tagline.png" alt="Ubuntu HRMS" className="auth-logo-img" />
            </div>
            <h1>Loading Dashboard...</h1>
            <p>Preparing your workspace</p>
            <div className="mt-6 w-full">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-40 ease-linear"
                  style={{ width: `${preloadProgress}%` }}
                />
              </div>
              <div className="text-center mt-2 text-sm text-slate-600">
                {preloadProgress}%
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <BsArrowRepeat className="animate-spin text-orange-500 text-2xl" />
            </div>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <div className="auth-logo">
                <img src="/ubuntu-logo-with-tagline.png" alt="Ubuntu HRMS" className="auth-logo-img" />
              </div>
              <h1>UBUNTU HRMS</h1>
              <p>Human Resource Management System</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setErrors(prev => ({ ...prev, username: '' }))
                  }}
                  disabled={loading}
                  className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && (
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium mt-1 block">
                    {errors.username}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrors(prev => ({ ...prev, password: '' }))
                    }}
                    disabled={loading}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium mt-1 block">
                    {errors.password}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
              </button>
            </form>

            <div className="auth-links">
              <Link to="/forgot-password" className="auth-link">
                Forgot Password?
              </Link>
              <div className="auth-divider">
                <span className="auth-divider-text">Don't have an account?</span>
              </div>
              <Link to="/register" className="auth-link">
                Create New Account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Login
