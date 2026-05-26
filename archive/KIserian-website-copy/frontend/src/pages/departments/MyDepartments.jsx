import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building, ChevronRight, Users, Shield } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { FullPageLoading } from '../../components/common/Loading'
import { DepartmentsEmptyState } from '../../components/common/EmptyState'
import { API_ENDPOINTS } from '../../constants/api'

const MyDepartments = () => {
  const toast = useToast()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(API_ENDPOINTS.DEPARTMENT.USER, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(json.error || json.details || 'Failed to load your departments')
        }
        setDepartments(Array.isArray(json.data) ? json.data : [])
      } catch (e) {
        console.error(e)
        toast.error(e.message || 'Failed to load departments')
        setDepartments([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <FullPageLoading message="Loading your departments..." />
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My departments</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Departments you belong to. Open a department hub for communications, meetings, and tasks.
        </p>
      </div>

      {departments.length === 0 ? (
        <DepartmentsEmptyState />
      ) : (
        <ul className="space-y-3">
          {departments.map((d) => (
            <li key={d.id}>
              <Link
                to={`/dashboard/departments/${d.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 shrink-0">
                    <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900 dark:text-white truncate">{d.name}</h2>
                    {d.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{d.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {d.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {d.category}
                        </span>
                      )}
                      {d.role && (
                        <span className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                          <Shield className="w-3 h-3" />
                          {d.role}
                        </span>
                      )}
                      {d.can_manage && (
                        <span className="text-xs text-amber-700 dark:text-amber-300">Can manage</span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {departments.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <Users className="w-4 h-4 inline mr-1 align-text-bottom" />
          Need the full church directory?{' '}
          <Link to="/dashboard/departments" className="text-blue-600 dark:text-blue-400 hover:underline">
            All departments
          </Link>
        </p>
      )}
    </div>
  )
}

export default MyDepartments
