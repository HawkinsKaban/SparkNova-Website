import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy-loaded components
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const Login = React.lazy(() => import('./components/auth/Login'));
const Register = React.lazy(() => import('./components/auth/Register'));
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard'));
const DetailPage = React.lazy(() => import('./components/dashboard/DetailPage'));
const Setting = React.lazy(() => import('./components/dashboard/Setting'));
const Layout = React.lazy(() => import('./components/layout/Layout'));
const ResetPassword = React.lazy(() => import('./components/auth/ResetPassword'));
const ForgotPassword = React.lazy(() => import('./components/auth/ForgotPassword'));
const PasswordResetConfirmation = React.lazy(() => import('./components/auth/PasswordResetConfirmation'));

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route Component with error boundary
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated() ? (
    <ErrorBoundary>
      <Layout>{children}</Layout>
    </ErrorBoundary>
  ) : (
    <Navigate to="/login" replace />
  );
};

// Public Route Component with error boundary
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return !isAuthenticated() ? (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

// Route configurations
const routes = [
  {
    path: '/',
    element: <LandingPage />,
    isPublic: true
  },
  {
    path: '/login',
    element: <Login />,
    isPublic: true
  },
  {
    path: '/register',
    element: <Register />,
    isPublic: true
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
    isPublic: true
  },
  {
    path: '/reset-password/:token',
    element: <PasswordResetConfirmation />,
    isPublic: true
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
    isPrivate: true
  },
  {
    path: '/detail/:deviceId',
    element: <DetailPage />,
    isPrivate: true
  },
  {
    path: '/settings',
    element: <Setting />,
    isPrivate: true
  },
  {
    path: '/reset',
    element: <ResetPassword />,
    isPrivate: true
  }
];

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {routes.map(({ path, element, isPublic, isPrivate }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    isPublic ? (
                      <PublicRoute>{element}</PublicRoute>
                    ) : isPrivate ? (
                      <PrivateRoute>{element}</PrivateRoute>
                    ) : (
                      element
                    )
                  }
                />
              ))}
              
              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;