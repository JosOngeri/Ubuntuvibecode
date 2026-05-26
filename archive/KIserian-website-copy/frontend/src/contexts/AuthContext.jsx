import { createContext, useContext, useReducer, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Check localStorage first, then sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('refreshToken')
      sessionStorage.removeItem('user')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

const AuthContext = createContext()

const initialState = {
  user: null,
  token: localStorage.getItem('token') || sessionStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'LOAD_USER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      }
    case 'LOAD_USER_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Load user from token on app start
  useEffect(() => {
    const loadUser = async () => {
      // Check localStorage first, then sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (token) {
        try {
          const response = await api.get('/auth/profile')
          dispatch({ type: 'LOAD_USER_SUCCESS', payload: response.data.user })
        } catch (error) {
          console.error('Failed to load user:', error)
          dispatch({ type: 'LOAD_USER_FAILURE' })
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('refreshToken')
          sessionStorage.removeItem('user')
        }
      } else {
        dispatch({ type: 'LOAD_USER_FAILURE' })
      }
    }

    loadUser()
  }, [])

  const login = async (credentials) => {
    try {
      console.log('Login attempt with:', credentials)
      dispatch({ type: 'LOGIN_START' })

      // Send both email and username fields, backend will determine which to use
      const loginData = {
        email: credentials.email.includes('@') ? credentials.email : undefined,
        username: credentials.email.includes('@') ? undefined : credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe || false
      }

      console.log('Sending login data:', loginData)
      const response = await api.post('/auth/login', loginData)

      console.log('Login response:', response.data)
      const { user, accessToken, refreshToken } = response.data

      // If remember me is not checked, use sessionStorage instead of localStorage
      const storage = credentials.rememberMe ? localStorage : sessionStorage
      storage.setItem('token', accessToken)
      storage.setItem('refreshToken', refreshToken)
      storage.setItem('user', JSON.stringify(user))

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: accessToken } })
      toast.success('Login successful!')

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      dispatch({ type: 'LOGIN_FAILURE' })
      const message = error.response?.data?.error || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      dispatch({ type: 'LOGIN_START' })
      const response = await api.post('/auth/register', userData)
      
      const { user, token } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } })
      toast.success('Registration successful!')
      
      return { success: true }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' })
      const message = error.response?.data?.error || 'Registration failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('refreshToken')
    sessionStorage.removeItem('user')
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out successfully')
  }

  const updateUser = (userData) => {
    // Update in both storage types
    const user = { ...state.user, ...userData }
    localStorage.setItem('user', JSON.stringify(user))
    sessionStorage.setItem('user', JSON.stringify(user))
    dispatch({ type: 'UPDATE_USER', payload: userData })
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    api, // Export the configured axios instance
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
