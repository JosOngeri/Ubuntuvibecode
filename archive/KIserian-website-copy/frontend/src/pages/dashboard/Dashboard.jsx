import { useState, useEffect } from 'react'
import {
  Users, DollarSign, Calendar, Megaphone, TrendingUp,
  Clock, CheckCircle, AlertCircle, ArrowRight, Building, Image as ImageIcon
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import Card from '../../components/common/Card'
import { FullPageLoading, InlineLoading } from '../../components/common/Loading'
import { EmptyState } from '../../components/common/EmptyState'
import '../../styles/dashboard.css'

const Dashboard = () => {
  const { user, api } = useAuth()
  const toast = useToast()
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalPayments: 0,
    upcomingEvents: 0,
    recentAnnouncements: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [recentPhotos, setRecentPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats from API
      const statsResponse = await api.get('/dashboard/stats')
      setStats(statsResponse.data.stats || {
        totalMembers: 0,
        totalPayments: 0,
        upcomingEvents: 0,
        recentAnnouncements: 0
      })

      // Fetch recent activities from API
      const activityResponse = await api.get('/dashboard/activity?limit=10')
      const iconMap = {
        payment: DollarSign,
        announcement: Megaphone,
        event: Calendar,
        member: Users
      }
      const colorMap = {
        payment: 'text-green-600',
        announcement: 'text-blue-600',
        event: 'text-purple-600',
        member: 'text-orange-600'
      }

      const formattedActivities = (activityResponse.data.activities || []).map((activity, index) => ({
        id: index,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        time: activity.time,
        icon: iconMap[activity.type] || Megaphone,
        color: colorMap[activity.type] || 'text-gray-600'
      }))

      setRecentActivities(formattedActivities)

      // Fetch recent photos from gallery
      const photosResponse = await fetch('/api/gallery/photos?limit=4')
      const photosData = await photosResponse.json()
      setRecentPhotos(photosData.photos || [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Failed to load dashboard data. Please try again.')
      // Fallback to mock data on error
      setStats({
        totalMembers: 0,
        totalPayments: 0,
        upcomingEvents: 0,
        recentAnnouncements: 0
      })
      setRecentActivities([])
      setRecentPhotos([])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Make Payment',
      description: 'Pay tithe and offerings',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
      link: '/dashboard/payments'
    },
    {
      title: 'View Announcements',
      description: 'Latest church news',
      icon: Megaphone,
      color: 'bg-blue-100 text-blue-600',
      link: '/dashboard/announcements'
    },
    {
      title: 'Upcoming Events',
      description: 'Church calendar',
      icon: Calendar,
      color: 'bg-purple-100 text-purple-600',
      link: '/dashboard/events'
    },
    {
      title: 'Member Directory',
      description: 'Find church members',
      icon: Users,
      color: 'bg-orange-100 text-orange-600',
      link: '/dashboard/members'
    },
    {
      title: 'My Departments',
      description: 'Manage department communications',
      icon: Building,
      color: 'bg-purple-100 text-purple-600',
      link: '/dashboard/my-departments'
    }
  ]

  const isAdmin = user?.roles?.some(role => 
    ['Super Admin', 'Pastor', 'First Elder'].includes(role)
  )

  if (loading) {
    return <FullPageLoading message="Loading dashboard..." />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Church Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.first_name}! Here's what's happening at SDA Church Kiserian Main today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={28} />
            </div>
            <span className="stat-label">Total Members</span>
            <span className="stat-value">{stats.totalMembers.toLocaleString()}</span>
            <span className="stat-change">↑ 12% from last month</span>
          </div>
        </Card>

        <Card>
          <div className="stat-card">
            <div className="stat-icon success">
              <DollarSign size={28} />
            </div>
            <span className="stat-label">Total Payments</span>
            <span className="stat-value">KES {stats.totalPayments.toLocaleString()}</span>
            <span className="stat-change">↑ 8% from last month</span>
          </div>
        </Card>

        <Card>
          <div className="stat-card">
            <div className="stat-icon pending">
              <Calendar size={28} />
            </div>
            <span className="stat-label">Upcoming Events</span>
            <span className="stat-value">{stats.upcomingEvents}</span>
            <span className="stat-change">Next event in 2 days</span>
          </div>
        </Card>

        <Card>
          <div className="stat-card present">
            <Megaphone size={28} />
          </div>
          <span className="stat-label">Announcements</span>
          <span className="stat-value">{stats.recentAnnouncements}</span>
          <span className="stat-change">3 new this week</span>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                to={action.link}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow group h-full flex flex-col"
              >
                <div className={`inline-flex p-3 rounded-lg ${action.color} mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-auto">
                  {action.description}
                </p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-full">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${activity.color} bg-opacity-10 flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="No recent activity"
              description="There has been no recent activity in the system."
            />
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-full">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Completed Tasks
                </span>
              </div>
              <span className="text-lg font-bold text-green-600 flex-shrink-0">24</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Pending Tasks
                </span>
              </div>
              <span className="text-lg font-bold text-yellow-600 flex-shrink-0">8</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <Users className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Active Members
                </span>
              </div>
              <span className="text-lg font-bold text-blue-600 flex-shrink-0">186</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <Calendar className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  This Week
                </span>
              </div>
              <span className="text-lg font-bold text-purple-600 flex-shrink-0">3 events</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Photos */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Photos</h2>
          <Link
            to="/dashboard/gallery"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
          >
            <span>Manage Gallery</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recentPhotos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"
              >
                <img
                  src={`https://api.telegram.org/file/bot${import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''}/${photo.telegram_file_id}`}
                  alt={photo.caption || 'Photo'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x200?text=Photo'
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all">
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-medium truncate">{photo.caption || 'Photo'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ImageIcon}
            title="No photos yet"
            description="Upload photos to the gallery to see them here."
          />
        )}
      </div>

      {/* Admin Quick Links */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-primary-600 to-gold-600 p-6 rounded-lg text-white">
          <h2 className="text-lg font-semibold mb-4">Admin Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/dashboard/users"
              className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
            >
              <span>Manage Users</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard/sms"
              className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
            >
              <span>Send SMS</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard/departments"
              className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
            >
              <span>Departments</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
