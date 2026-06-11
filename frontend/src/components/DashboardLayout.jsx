import React, { useState, useContext } from 'react';
import Header from './common/Header';
import Sidebar from './common/Sidebar';

const LayoutContext = React.createContext({ isNested: false });

export const useLayoutContext = () => useContext(LayoutContext);

const DashboardLayout = ({ children }) => {
  const parent = useContext(LayoutContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // If already inside a DashboardLayout, just render children (avoid nested sidebars)
  if (parent.isNested) {
    return <>{children}</>;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <LayoutContext.Provider value={{ isNested: true }}>
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
        <Header onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={closeSidebar}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={toggleCollapse}
          />
          <main
            className={`flex-1 overflow-y-auto w-full transition-all duration-300 ${sidebarCollapsed ? 'lg:w-[calc(100%-5rem)]' : 'lg:w-[calc(100%-16rem)]'}`}
          >
            <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
};

export default DashboardLayout;
