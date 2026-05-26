import React from 'react'
import { Info } from 'lucide-react'

const SettingNumber = ({ label, description, value, onChange, placeholder, disabled, error, min, max, step }) => {
  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value)
    onChange(isNaN(newValue) ? '' : newValue)
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
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

export default SettingNumber
