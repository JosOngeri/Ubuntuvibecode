import React from 'react';
import { BsExclamationTriangle, BsArrowRepeat } from 'react-icons/bs';
import logger from '../../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    logger.error('ErrorBoundary', 'Uncaught render error', error, {
      componentStack: errorInfo?.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

const ErrorFallback = ({ error, errorInfo, onReset }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <BsExclamationTriangle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We apologize for the inconvenience. An error occurred while rendering this page.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 mb-6 text-left overflow-auto max-h-40">
            <p className="text-sm font-mono text-red-600 dark:text-red-400">{error.toString()}</p>
            {errorInfo && (
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-2">
                {errorInfo.componentStack}
              </p>
            )}
          </div>
        )}

        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#CB7246] text-white rounded-lg hover:bg-[#F27C12] transition-colors font-medium"
        >
          <BsArrowRepeat className="h-4 w-4" />
          Try Again
        </button>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => (window.location.href = '/')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#CB7246] dark:hover:text-[#F27C12] transition-colors"
          >
            Go to Home Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
