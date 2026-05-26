import { Link } from 'react-router-dom'

const Terms = () => (
  <div className="container mx-auto px-4 py-12 max-w-3xl">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Terms of use</h1>
    <div className="prose dark:prose-invert text-gray-700 dark:text-gray-300 space-y-4">
      <p>
        This portal is provided by SDA Church Kiserian Main for members and authorised church workers. By creating
        an account you agree to use it responsibly and in line with church policies.
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Do not share your login credentials.</li>
        <li>Respect privacy when viewing member or payment information you are permitted to access.</li>
        <li>Administrators may suspend accounts that misuse the system.</li>
      </ul>
      <p className="text-sm text-gray-500">Update this page with counsel-approved legal text when available.</p>
    </div>
    <Link to="/auth/register" className="inline-block mt-8 text-primary-600 hover:underline">
      ← Back to registration
    </Link>
  </div>
)

export default Terms
