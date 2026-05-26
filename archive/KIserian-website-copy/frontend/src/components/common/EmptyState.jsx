import { Users, FileText, Calendar, Building, Search, Plus, AlertCircle } from 'lucide-react'

/**
 * EmptyState - A reusable empty state component
 */
export const EmptyState = ({
  icon: Icon = AlertCircle,
  title = 'No data found',
  description = 'There is no data to display at this time.',
  action = null,
  actionLabel = 'Add New',
  onAction = null
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
        <Icon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
        {description}
      </p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action}
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  )
}

/**
 * MembersEmptyState - Empty state for member directory
 */
export const MembersEmptyState = ({ onAddMember }) => {
  return (
    <EmptyState
      icon={Users}
      title="No members found"
      description="No members have been added to the directory yet."
      action={Users}
      actionLabel="Add Member"
      onAction={onAddMember}
    />
  )
}

/**
 * AnnouncementsEmptyState - Empty state for announcements
 */
export const AnnouncementsEmptyState = ({ onCreateAnnouncement }) => {
  return (
    <EmptyState
      icon={FileText}
      title="No announcements"
      description="There are no announcements at this time."
      action={FileText}
      actionLabel="Create Announcement"
      onAction={onCreateAnnouncement}
    />
  )
}

/**
 * EventsEmptyState - Empty state for events
 */
export const EventsEmptyState = ({ onCreateEvent }) => {
  return (
    <EmptyState
      icon={Calendar}
      title="No upcoming events"
      description="There are no upcoming events scheduled."
      action={Calendar}
      actionLabel="Create Event"
      onAction={onCreateEvent}
    />
  )
}

/**
 * DepartmentsEmptyState - Empty state for departments
 */
export const DepartmentsEmptyState = ({ onCreateDepartment }) => {
  return (
    <EmptyState
      icon={Building}
      title="No departments"
      description="No departments have been created yet."
      action={Building}
      actionLabel="Create Department"
      onAction={onCreateDepartment}
    />
  )
}

/**
 * SearchEmptyState - Empty state for search results
 */
export const SearchEmptyState = ({ searchTerm, onClearSearch }) => {
  return (
    <EmptyState
      icon={Search}
      title={`No results for "${searchTerm}"`}
      description="Try adjusting your search terms or filters."
    />
  )
}

/**
 * PaymentsEmptyState - Empty state for payments
 */
export const PaymentsEmptyState = ({ onMakePayment }) => {
  return (
    <EmptyState
      icon={FileText}
      title="No payment history"
      description="You haven't made any payments yet."
      action={FileText}
      actionLabel="Make Payment"
      onAction={onMakePayment}
    />
  )
}

/**
 * ErrorEmptyState - Empty state for error states
 */
export const ErrorEmptyState = ({ message = 'Something went wrong', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Error
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
