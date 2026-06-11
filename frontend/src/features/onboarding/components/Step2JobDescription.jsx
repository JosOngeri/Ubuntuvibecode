import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { onboardingAPI } from '../services/onboarding.api';

export default function Step2JobDescription({ initialData, applicationId, onSubmit, saving }) {
  const [formData, setFormData] = useState({
    department: '',
    supervisorId: '',
    schedule: {
      workDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '17:00',
      breakDurationMinutes: 60,
      canSelfCheckin: false,
    },
  });
  const [departments, setDepartments] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDepartment, setShowNewDepartment] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        schedule: { ...prev.schedule, ...initialData.schedule },
      }));
    }
  }, [initialData]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptData, supData] = await Promise.all([
        onboardingAPI.getDepartments(),
        onboardingAPI.getPotentialSupervisors(),
      ]);
      setDepartments(deptData);
      setSupervisors(supData);
    } catch (error) {
      toast.error('Failed to load departments and supervisors');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: { ...prev.schedule, [field]: value },
    }));
  };

  const handleWorkDayToggle = day => {
    setFormData(prev => {
      const workDays = prev.schedule.workDays.includes(day)
        ? prev.schedule.workDays.filter(d => d !== day)
        : [...prev.schedule.workDays, day].sort();
      return {
        ...prev,
        schedule: { ...prev.schedule, workDays },
      };
    });
  };

  const handleCreateDepartment = async e => {
    e.preventDefault();
    try {
      const dept = await onboardingAPI.createDepartment(newDepartment);
      setDepartments([...departments, dept]);
      setFormData(prev => ({ ...prev, department: dept.name }));
      setShowNewDepartment(false);
      setNewDepartment({ name: '', description: '' });
      toast.success('Department created successfully');
    } catch (error) {
      toast.error('Failed to create department');
      console.error(error);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    
    if (!formData.department) {
      toast.error('Please select a department');
      return;
    }

    onSubmit(formData, true);
  };

  const handleSaveAndExit = () => {
    onSubmit(formData, false);
  };

  const workDays = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
  ];

  if (loading) {
    return <div className="text-gray-500">Loading options...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Department Allocation */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Department Allocation
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department *
            </label>
            <select
              value={formData.department}
              onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select Department...</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowNewDepartment(true)}
            className="text-orange-500 hover:text-orange-600 text-sm font-medium"
          >
            + Create New Department
          </button>
        </div>

        {showNewDepartment && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Create New Department</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Department Name"
                value={newDepartment.name}
                onChange={e => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              />
              <textarea
                placeholder="Description"
                value={newDepartment.description}
                onChange={e => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateDepartment}
                  className="px-3 py-1 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewDepartment(false)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Supervisor Allocation */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Supervisor Allocation
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Supervisor
          </label>
          <select
            value={formData.supervisorId}
            onChange={e => setFormData(prev => ({ ...prev, supervisorId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select Supervisor...</option>
            {supervisors.map(sup => (
              <option key={sup.id} value={sup.id}>
                {sup.name} ({sup.role}) - {sup.department}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Workday Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Workday Configuration
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.schedule.startTime}
                onChange={e => handleScheduleChange('startTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={formData.schedule.endTime}
                onChange={e => handleScheduleChange('endTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Break Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.schedule.breakDurationMinutes}
              onChange={e => handleScheduleChange('breakDurationMinutes', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Work Days
            </label>
            <div className="flex flex-wrap gap-2">
              {workDays.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleWorkDayToggle(day.value)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    formData.schedule.workDays.includes(day.value)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="canSelfCheckin"
              checked={formData.schedule.canSelfCheckin}
              onChange={e => handleScheduleChange('canSelfCheckin', e.target.checked)}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="canSelfCheckin" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Allow Self Check-in
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleSaveAndExit}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Save & Exit
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </form>
  );
}
