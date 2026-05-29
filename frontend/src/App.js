import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Jobs from './pages/jobs/Jobs';
import Candidates from './pages/candidates/Candidates';
import Applications from './pages/applications/Applications';
import Interviews from './pages/interviews/Interviews';
import Pipeline from './pages/pipeline/Pipeline';
import SmartShortlist from './pages/shortlist/SmartShortlist';
import Settings from './pages/Settings';
import LandingPage from './pages/landing/LandingPage';
import { Spinner } from './components/ui';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="applications" element={<Applications />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="shortlist" element={<SmartShortlist />} />
        <Route path="interviews" element={<Interviews />} />
        <Route path="settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
      </Route>
      {/* Legacy redirects */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/jobs" element={<Navigate to="/app/jobs" replace />} />
      <Route path="/candidates" element={<Navigate to="/app/candidates" replace />} />
      <Route path="/applications" element={<Navigate to="/app/applications" replace />} />
      <Route path="/interviews" element={<Navigate to="/app/interviews" replace />} />
      <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
