import { useState, useEffect } from 'react'
import { Send, Users, MessageSquare, Clock, CheckCircle, DollarSign, Upload, Download, X } from 'lucide-react'
import Card from '../components/common/Card'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const SMS = () => {
  const { user, api } = useAuth()
  const toast = useToast()
  const [message, setMessage] = useState('')
  const [recipients, setRecipients] = useState('all')
  const [sending, setSending] = useState(false)
  const [sentMessages, setSentMessages] = useState([])
  const [balance, setBalance] = useState(null)
  const [csvNumbers, setCsvNumbers] = useState([])
  const [csvFileName, setCsvFileName] = useState('')
  const [showCsvUpload, setShowCsvUpload] = useState(false)
  const [manualNumbers, setManualNumbers] = useState('')

  useEffect(() => {
    fetchSMSHistory()
    fetchSMSBalance()
  }, [])

  const fetchSMSHistory = async () => {
    try {
      const response = await api.get('/sms/history')
      if (response.data.success) {
        setSentMessages(response.data.data.map(msg => ({
          id: msg.id,
          message: msg.message,
          recipients: msg.recipient_type === 'all' ? 'All Members' : msg.recipient_type,
          sentAt: new Date(msg.sent_at).toLocaleString(),
          status: msg.successful_count > 0 ? 'delivered' : 'failed',
          count: msg.recipient_count
        })))
      }
    } catch (error) {
      console.error('Failed to fetch SMS history:', error)
      toast.error('Failed to load SMS history')
    }
  }

  const fetchSMSBalance = async () => {
    try {
      const response = await api.get('/sms/balance')
      if (response.data.success) {
        setBalance(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch SMS balance:', error)
      toast.error('Failed to load SMS balance')
    }
  }

  const handleCSVUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    setCsvFileName(file.name)
    const reader = new FileReader()

    reader.onload = (e) => {
      const text = e.target.result
      const numbers = parseCSV(text)
      setCsvNumbers(numbers)
    }

    reader.readAsText(file)
  }

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    const numbers = []
    
    lines.forEach((line, index) => {
      // Skip header if it exists
      if (index === 0 && line.toLowerCase().includes('phone')) return
      
      // Extract phone numbers from CSV
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''))
      columns.forEach(column => {
        // Check if column looks like a phone number
        const phoneRegex = /[\d\s\-\+\(\)]+/
        const match = column.match(phoneRegex)
        if (match) {
          const phone = match[0].replace(/\D/g, '')
          if (phone.length >= 9) { // Valid phone number length
            numbers.push(phone)
          }
        }
      })
    })
    
    return [...new Set(numbers)] // Remove duplicates
  }

  const handleSendSMS = async () => {
    if (!message.trim()) return

    setSending(true)
    try {
      let recipientData = {
        message: message,
        recipients: recipients,
        recipientType: recipients === 'all' ? 'all' : 'department'
      }

      // If using CSV numbers, override recipients
      if (recipients === 'csv' && csvNumbers.length > 0) {
        recipientData = {
          message: message,
          recipients: csvNumbers,
          recipientType: 'custom'
        }
      }

      // If using manual numbers, override recipients
      if (recipients === 'manual' && manualNumbers.trim()) {
        const phoneArray = manualNumbers
          .split(',')
          .map(num => num.trim())
          .filter(num => num.length > 0)
        
        recipientData = {
          message: message,
          recipients: phoneArray,
          recipientType: 'custom'
        }
      }

      const response = await api.post('/sms/send-blessed', recipientData)
      
      if (response.data.success) {
        // Refresh history and balance
        await fetchSMSHistory()
        await fetchSMSBalance()
        
        setMessage('')
        setRecipients('all')
        
        alert(`SMS sent successfully! ${data.data.sentCount} messages delivered.`)
      } else {
        alert(`Failed to send SMS: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to send SMS:', error)
      alert('Failed to send SMS. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const downloadSampleCSV = () => {
    const csvContent = `phone,name
254712345678,John Doe
254723456789,Jane Smith
254734567890,Bob Johnson
254745678901,Alice Brown`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_phone_numbers.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">SMS Messaging</h1>
        <p className="page-subtitle">Send text messages to church members and groups</p>
        {balance && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <DollarSign size={16} className="text-green-600" />
            <span className="font-medium">SMS Balance: {balance.balance} {balance.currency}</span>
            {balance.message && (
              <span className="text-gray-500">({balance.message})</span>
            )}
          </div>
        )}
      </div>

      {/* Send SMS Form */}
      <Card>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
          Send New Message
        </h3>
        
        <form onSubmit={handleSendSMS} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipients
            </label>
            <select
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Members</option>
              <option value="elders">Elders</option>
              <option value="youth">Youth Group</option>
              <option value="choir">Choir Members</option>
              <option value="leadership">Leadership Team</option>
              <option value="manual">Enter Phone Numbers</option>
              <option value="csv">CSV Upload</option>
            </select>
          </div>

          {/* Manual Phone Numbers Section */}
          {recipients === 'manual' && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Enter Phone Numbers
              </h4>
              
              <div className="space-y-3">
                <textarea
                  value={manualNumbers}
                  onChange={(e) => setManualNumbers(e.target.value)}
                  placeholder="Enter phone numbers separated by commas..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Enter phone numbers separated by commas. Supports formats: +254724363290, 254724363290, 0724363290, 724363290
                </div>
                
                {manualNumbers && (
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    📱 {manualNumbers.split(',').filter(n => n.trim()).length} phone numbers ready
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CSV Upload Section */}
          {recipients === 'csv' && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Upload Phone Numbers
                </h4>
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Download size={12} />
                  Download Sample
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    <Upload size={16} />
                    Choose CSV File
                  </label>
                  
                  {csvFileName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="truncate">{csvFileName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCsvFileName('')
                          setCsvNumbers([])
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                {csvNumbers.length > 0 && (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    ✅ {csvNumbers.length} phone numbers loaded from CSV
                  </div>
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  CSV should have a 'phone' column. Supports formats: 254712345678, 0712345678, 712345678
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              maxLength={160}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {message.length}/160 characters
            </div>
          </div>

          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
            {sending ? 'Sending...' : 'Send SMS'}
          </button>
        </form>
      </Card>

      {/* Sent Messages */}
      <Card>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-green-500 rounded-full"></span>
          Recent Messages
        </h3>

        <div className="space-y-4">
          {sentMessages.map((msg) => (
            <div key={msg.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={16} className="text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {msg.recipients}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock size={14} />
                    {msg.sentAt}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Delivered
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                {msg.message}
              </p>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Sent to {msg.count} recipients
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default SMS
