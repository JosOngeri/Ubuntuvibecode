# Sentry Error Tracking Setup

Sentry provides real-time error monitoring and performance tracking for production environments.

## Why Add Sentry?

- **Automatic error capture** - JavaScript errors, unhandled promise rejections, API failures
- **User context** - Know which user experienced the error (role, ID, username)
- **Release tracking** - See which deployment introduced a bug
- **Performance monitoring** - Track slow API endpoints and page loads
- **Alerting** - Get notified immediately when critical errors occur

---

## Backend Setup (Node.js/Express)

### 1. Install Sentry

```bash
cd backend
npm install @sentry/node
```

### 2. Add to `backend/app.js`

Add this at the very top of `backend/app.js` (before any other imports):

```javascript
const Sentry = require('@sentry/node');

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.RELEASE_VERSION || '1.0.0',
  tracesSampleRate: 0.1, // Capture 10% of transactions for performance
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.['x-auth-token'];
    }
    return event;
  },
});

// Request handler must be before other middleware
app.use(Sentry.Handlers.requestHandler());

// ... existing middleware and routes ...

// Error handler must be after all routes, before global error handler
app.use(Sentry.Handlers.errorHandler());

// Keep your existing global error handler
app.use((err, req, res, next) => {
  logger.error('app.globalErrorHandler', err.message || 'Unhandled error', err, {
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
  });
  res.status(500).json({ msg: 'Server error' });
});
```

### 3. Add User Context

Update `backend/middleware/auth.js` to attach user context to Sentry:

```javascript
const Sentry = require('@sentry/node');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    logger.warn('auth', 'No token provided', { url: req.originalUrl, method: req.method });
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Add user context to Sentry
    Sentry.setUser({
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    });

    next();
  } catch (err) {
    logger.warn('auth', `Token invalid: ${err.message}`, { url: req.originalUrl, method: req.method, errName: err.name });
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = auth;
```

### 4. Add Transaction Names

For better performance tracking, add transaction names to key routes:

```javascript
// In your route files, wrap handlers with Sentry
const Sentry = require('@sentry/node');

router.get('/employees', Sentry.startSpan({ name: 'GET /api/employees' }, () => {
  // ... existing handler
}));
```

---

## Frontend Setup (React)

### 1. Install Sentry React

```bash
cd frontend
npm install @sentry/react
```

### 2. Add to `frontend/src/main.jsx`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE || 'development',
  release: import.meta.env.VITE_APP_VERSION || '1.0.0',
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        'localhost',
        'ubuntu-hrms.vercel.app',
        /^\//,
      ],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies;
    }
    return event;
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 3. Wrap with Error Boundary

Update `frontend/src/App.jsx` to wrap with Sentry's error boundary:

```javascript
import * as Sentry from '@sentry/react';

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            {/* ... existing routes */}
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  );
}

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-4">An error has been reported to our team.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
```

### 4. Add User Context

Update `frontend/src/contexts/AuthContext.jsx` to set Sentry user context:

```javascript
import * as Sentry from '@sentry/react';

// In the login function
const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      username,
      password,
    });
    const { token, mustChangePassword, resetToken, msg } = response.data;

    if (mustChangePassword) {
      return { mustChangePassword: true, resetToken, msg };
    }

    setToken(token);
    axios.defaults.headers.common['x-auth-token'] = token;
    localStorage.setItem('authToken', token);

    const decoded = decodeToken(token);
    setUser(decoded);

    // Set Sentry user context
    Sentry.setUser({
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    });

    await refreshPortalProfile();
    await fetchUserRolesAndAllocations(decoded.id);

    return { mustChangePassword: false, user: decoded };
  } catch (error) {
    throw error.response?.data?.msg || 'Login failed';
  }
};

// In the logout function
const logout = () => {
  setUser(null);
  setToken(null);
  // ... other cleanup

  // Clear Sentry user context
  Sentry.setUser(null);
};
```

---

## Environment Variables

Add these to your environment configuration:

### Backend (.env)
```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
RELEASE_VERSION=1.0.0
```

### Frontend (.env.production)
```env
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0
```

### Frontend (.env.development)
```env
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_APP_VERSION=dev
```

---

## Getting a Sentry DSN

1. Go to https://sentry.io/
2. Sign up for a free account
3. Create a new project (Node.js for backend, React for frontend)
4. Copy the DSN from project settings
5. Add to your environment variables

---

## Testing Sentry Locally

To test Sentry in development:

1. Add your Sentry DSN to local `.env` files
2. Intentionally trigger an error:

**Backend test:**
```javascript
// Add to any route temporarily
router.get('/test-sentry', (req, res) => {
  throw new Error('Test Sentry error');
});
```

**Frontend test:**
```javascript
// Add to any component temporarily
<button onClick={() => { throw new Error('Test Sentry error'); }}>
  Trigger Error
</button>
```

3. Check your Sentry dashboard - the error should appear within seconds

---

## Best Practices

1. **Never commit DSNs** - Use environment variables
2. **Filter sensitive data** - Use `beforeSend` to remove passwords, tokens
3. **Set user context** - Attach user info to all errors
4. **Use releases** - Track which deployment introduced bugs
5. **Set environment** - Separate dev/staging/prod errors
6. **Enable replay** - See what the user saw before the error
7. **Set sample rates** - Don't send 100% of transactions (cost control)
8. **Add breadcrumbs** - Track user actions leading to errors

---

## Cost Considerations

Sentry's free tier includes:
- 5,000 errors/month
- 1,000 transactions/month
- 1,000 replays/month

For a production HRMS, you may need:
- Team plan ($26/month) - 50,000 errors/month
- Business plan ($80/month) - 100,000 errors/month

Alternatives (free):
- **LogRocket** - Free tier available
- **Rollbar** - Free tier available
- **Sentry Self-Hosted** - Free if you host it yourself
