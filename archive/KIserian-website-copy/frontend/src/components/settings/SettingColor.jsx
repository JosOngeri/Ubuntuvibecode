import React from 'react'
import { Info } from 'lucide-react'

const SettingColor = ({ label, description, value, onChange, disabled, error }) => {
  const handleChange = (e) => {
    onChange(e.target.value)
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={`w-12 h-10 border rounded cursor-pointer ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'cursor-not-allowed' : ''}`}
        />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="#000000"
          className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      </div>
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

export default SettingColor
