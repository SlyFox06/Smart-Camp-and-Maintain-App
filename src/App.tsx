import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import StudentDashboard from './components/StudentDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';

function AppContent() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {user && <LogoutButton onLogout={logout} />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />

        <Route path="/technician" element={
          <ProtectedRoute allowedRoles={['technician']}>
            <TechnicianDashboard />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/report/:assetId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <QuickReportHandler />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const QuickReportHandler = () => {
  const { assetId } = useParams();

  return (
    <StudentDashboard
      prefilledAssetId={assetId}
      autoOpenForm={true}
    />
  );
};

// Logout Button Component
const LogoutButton = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={onLogout}
        className="px-6 py-3 bg-white/20 backdrop-blur-lg text-white font-semibold rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30 shadow-lg"
      >
        Sign Out
      </button>
    </div>
  );
};

export default App;
