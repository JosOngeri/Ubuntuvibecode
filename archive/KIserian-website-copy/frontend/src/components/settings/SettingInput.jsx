import React from 'react'
import { Info } from 'lucide-react'

const SettingInput = ({ label, description, value, onChange, type = 'text', placeholder, disabled, error, validationRules }) => {
  const handleChange = (e) => {
    const newValue = e.target.value
    onChange(newValue)
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {description && (
        <p className="flex items-center text-xs text-gray-500">
          <Info className="w-3 h-3 mr-1" />
          {description}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

export default SettingInput
