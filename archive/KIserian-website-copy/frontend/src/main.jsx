import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { createAppRouter } from './router.jsx'
import './index.css'

const AppWrapper = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const router = createAppRouter(darkMode, setDarkMode);

  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
            <RouterProvider
              router={router}
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            />
          </div>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>,
)
