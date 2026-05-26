import { Loader2 } from 'lucide-react'

/**
 * FullPageLoading - A full-page loading spinner
 */
export const FullPageLoading = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  )
}

/**
 * InlineLoading - A smaller inline loading spinner
 */
export const InlineLoading = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]} ${className}`} />
  )
}

/**
 * CardLoading - A skeleton loading state for cards
 */
export const CardLoading = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  )
}

/**
 * TableLoading - A skeleton loading state for table rows
 */
export const TableLoading = ({ rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </td>
        </tr>
      ))}
    </>
  )
}

/**
 * ButtonLoading - A loading state for buttons
 */
export const ButtonLoading = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
  )
}

/**
 * withLoading - HOC to add loading state to components
 */
export const withLoading = (Component) => {
  return ({ loading, ...props }) => {
    if (loading) {
      return <FullPageLoading />
    }
    return <Component {...props} />
  }
}
