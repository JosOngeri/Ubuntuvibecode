import React from 'react'
import { Info } from 'lucide-react'

const SettingBoolean = ({ label, description, value, onChange, disabled }) => {
  const handleChange = (e) => {
    onChange(e.target.checked)
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
        />
        <label className="ml-2 block text-sm font-medium text-gray-700">
          {label}
        </label>
      </div>
      {description && (
        <p className="flex items-center text-xs text-gray-500 ml-6">
          <Info className="w-3 h-3 mr-1" />
          {description}
        </p>
      )}
    </div>
  )
}

export default SettingBoolean
