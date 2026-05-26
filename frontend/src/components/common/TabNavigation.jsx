import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const TabNavigation = ({ tabs, defaultTab = null, persistKey = null, onTabChange = null }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [tabData, setTabData] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [preloadedTabs, setPreloadedTabs] = useState(new Set());
  const preloadTimeoutRef = useRef({});
  
  const { getComponentSetting, getUserPreference } = useSettings();

  // Get configurable settings
  const animationSpeed = getComponentSetting('TabNavigation', 'animationSpeed', 200);
  const persistActiveTab = getComponentSetting('TabNavigation', 'persistActiveTab', true);

  // Load saved tab preference if persistence is enabled
  useEffect(() => {
    if (persistKey && persistActiveTab) {
      const savedTab = getUserPreference(`tab_${persistKey}`);
      if (savedTab && tabs.find(t => t.id === savedTab)) {
        setActiveTab(savedTab);
      }
    }
  }, [persistKey, persistActiveTab, tabs]);

  // Preload tabs in background after active tab loads
  useEffect(() => {
    if (activeTab) {
      // Load active tab immediately
      loadTabData(activeTab, true);
      
      // Preload other tabs after a short delay
      const preloadDelay = 500; // 500ms delay before preloading
      
      tabs.forEach(tab => {
        if (tab.id !== activeTab && !preloadedTabs.has(tab.id)) {
          const timeoutId = setTimeout(() => {
            loadTabData(tab.id, false);
            setPreloadedTabs(prev => new Set([...prev, tab.id]));
          }, preloadDelay);
          
          preloadTimeoutRef.current[tab.id] = timeoutId;
        }
      });

      // Cleanup timeouts
      return () => {
        Object.values(preloadTimeoutRef.current).forEach(timeoutId => {
          clearTimeout(timeoutId);
        });
      };
    }
  }, [activeTab, tabs]);

  const loadTabData = useCallback(async (tabId, isActive = false) => {
    if (tabData[tabId] && !isActive) return; // Already loaded
    
    try {
      setLoadingStates(prev => ({ ...prev, [tabId]: true }));
      
      if (tabs.find(t => t.id === tabId)?.onLoad) {
        const data = await tabs.find(t => t.id === tabId).onLoad();
        setTabData(prev => ({ ...prev, [tabId]: data }));
      }
    } catch (error) {
      console.error(`Failed to load tab ${tabId}:`, error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [tabId]: false }));
    }
  }, [tabs, tabData]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    
    // Save preference if persistence is enabled
    if (persistKey && persistActiveTab) {
      // Note: This would need to be integrated with user preferences API
      localStorage.setItem(`tab_${persistKey}`, tabId);
    }

    // Call onTabChange callback if provided
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isLoading = loadingStates[tab.id];
          const badge = tab.badge;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap relative ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              style={{ transitionDuration: `${animationSpeed}ms` }}
            >
              {Icon && <Icon size={16} />}
              {tab.label}
              {badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {badge}
                </span>
              )}
              {isLoading && isActive && (
                <div className="ml-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="relative min-h-[400px]">
        {activeTabData ? (
          <div 
            key={activeTab}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDuration: `${animationSpeed}ms` }}
          >
            {activeTabData.render ? (
              activeTabData.render(tabData[activeTab], loadingStates[activeTab])
            ) : (
              <div className="text-slate-500 dark:text-slate-400">
                No content defined for this tab
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No tab selected
          </div>
        )}
      </div>
    </div>
  );
};

export default TabNavigation;
