import { Link } from 'react-router-dom'
import { Church, Mail } from 'lucide-react'

const ForgotPassword = () => {
  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
            <Church className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset your password</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Password self-service is not enabled yet. Please contact the church communications office or a pastor so
          they can reset your account.
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 py-6 px-6 shadow-lg rounded-lg space-y-4 text-sm text-gray-700 dark:text-gray-300">
        <a
          href="mailto:info@sda-kiserian.org?subject=Portal%20password%20reset"
          className="flex items-center gap-2 text-primary-600 font-medium hover:underline"
        >
          <Mail className="w-4 h-4" />
          Email info@sda-kiserian.org
        </a>
        <p>Include your registered name and username if you know it.</p>
      </div>
      <p className="text-center text-sm">
        <Link to="/auth/login" className="text-primary-600 hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  )
}

export default ForgotPassword
