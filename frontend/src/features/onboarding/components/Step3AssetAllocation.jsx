import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { onboardingAPI } from '../services/onboarding.api';

export default function Step3AssetAllocation({ initialData, applicationId, onSubmit, saving }) {
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    if (initialData?.assetIds) {
      setSelectedAssets(initialData.assetIds);
    }
  }, [initialData]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await onboardingAPI.getAvailableAssets();
      setAvailableAssets(data);
    } catch (error) {
      toast.error('Failed to load available assets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetToggle = assetId => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit({ assetIds: selectedAssets }, true);
  };

  const handleSaveAndExit = () => {
    onSubmit({ assetIds: selectedAssets }, false);
  };

  const filteredAssets = availableAssets.filter(asset =>
    asset.name.toLowerCase().includes(filter.toLowerCase()) ||
    asset.type?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return <div className="text-gray-500">Loading available assets...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Assets to Assign
        </h3>
        
        {/* Filter */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search assets..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Asset List */}
        {filteredAssets.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
            No available assets found
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAssets.map(asset => (
              <div
                key={asset.id}
                className={`p-4 border rounded-md cursor-pointer transition-colors ${
                  selectedAssets.includes(asset.id)
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleAssetToggle(asset.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAssets.includes(asset.id)}
                        onChange={() => handleAssetToggle(asset.id)}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {asset.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {asset.type}
                        </div>
                      </div>
                    </div>
                    {asset.description && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 ml-7">
                        {asset.description}
                      </div>
                    )}
                    {asset.serialNumber && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-500 ml-7">
                        Serial: {asset.serialNumber}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      asset.condition === 'new'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : asset.condition === 'good'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {asset.condition}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Assets Summary */}
      {selectedAssets.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="font-medium text-gray-900 dark:text-white mb-2">
            Selected Assets ({selectedAssets.length})
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedAssets.length} asset(s) will be assigned to the employee
          </div>
        </div>
      )}

      {/* Skip Option */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>You can skip this step if no assets need to be assigned at this time.</p>
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
