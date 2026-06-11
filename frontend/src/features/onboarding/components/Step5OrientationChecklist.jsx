import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function Step5OrientationChecklist({ initialData, applicationId, onSubmit, saving }) {
  const [checklistItems, setChecklistItems] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);

  const defaultChecklist = [
    { id: 1, title: 'Company Policy Review', description: 'Review employee handbook', required: true },
    { id: 2, title: 'IT Setup', description: 'Computer and email setup', required: true },
    { id: 3, title: 'Security Training', description: 'Complete security awareness training', required: true },
    { id: 4, title: 'Benefits Enrollment', description: 'Enroll in benefits program', required: true },
    { id: 5, title: 'Team Introduction', description: 'Meet with team members', required: false },
    { id: 6, title: 'Workspace Tour', description: 'Tour of office/facilities', required: false },
  ];

  useEffect(() => {
    setChecklistItems(defaultChecklist);
    if (initialData?.completedItems) {
      setCompletedItems(initialData.completedItems);
    }
    if (initialData?.notes) {
      setNotes(initialData.notes);
    }
    setLoading(false);
  }, [initialData]);

  const handleItemToggle = itemId => {
    setCompletedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleNoteChange = (itemId, value) => {
    setNotes(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();

    // Check if all required items are completed
    const requiredItems = checklistItems.filter(item => item.required);
    const missingRequired = requiredItems.filter(item => !completedItems.includes(item.id));

    if (missingRequired.length > 0) {
      toast.error('Please complete all required orientation items');
      return;
    }

    onSubmit({ completedItems, notes }, true);
  };

  const handleSaveAndExit = () => {
    onSubmit({ completedItems, notes }, false);
  };

  const completedCount = completedItems.length;
  const totalCount = checklistItems.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  if (loading) {
    return <div className="text-gray-500">Loading checklist...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Orientation Checklist
        </h3>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{completedCount} of {totalCount} completed ({progress}%)</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-4">
          {checklistItems.map(item => (
            <div
              key={item.id}
              className={`p-4 border rounded-md ${
                completedItems.includes(item.id)
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id={`item-${item.id}`}
                  checked={completedItems.includes(item.id)}
                  onChange={() => handleItemToggle(item.id)}
                  className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 mt-0.5"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`item-${item.id}`}
                    className="font-medium text-gray-900 dark:text-white cursor-pointer"
                  >
                    {item.title}
                    {item.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.description}
                  </p>
                  
                  {/* Notes Field */}
                  <div className="mt-3">
                    <textarea
                      placeholder="Add notes (optional)"
                      value={notes[item.id] || ''}
                      onChange={e => handleNoteChange(item.id, e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="text-red-500">*</span>
          <span>Required</span>
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
          {saving ? 'Saving...' : 'Complete Onboarding'}
        </button>
      </div>
    </form>
  );
}
