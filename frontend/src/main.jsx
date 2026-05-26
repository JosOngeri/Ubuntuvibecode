import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { SettingsProvider } from './contexts/SettingsContext'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import logger from './utils/logger'

window.onerror = (message, source, lineno, colno, error) => {
  logger.error('window.onerror', String(message), error, { source, lineno, colno });
};

window.addEventListener('unhandledrejection', (event) => {
  logger.error('window.unhandledrejection', 'Unhandled promise rejection', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
