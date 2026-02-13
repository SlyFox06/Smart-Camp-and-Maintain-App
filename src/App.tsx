import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import StudentDashboard from './components/StudentDashboard';
import HostelDashboard from './components/HostelDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';
import AdminDashboard from './components/AdminDashboard';
import WardenDashboard from './components/WardenDashboard';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import EmergencySOS from './components/EmergencySOS';

function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* LogoutButton Removed: Dashboards now handle their own logout */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public Emergency Route - No Auth Required */}
        <Route path="/sos" element={<EmergencySOS />} />
        <Route path="/emergency" element={<EmergencySOS />} />


        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard scope="college" />
          </ProtectedRoute>
        } />

        <Route path="/hostel-student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <HostelDashboard />
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

        <Route path="/warden" element={
          <ProtectedRoute allowedRoles={['warden']}>
            <WardenDashboard />
          </ProtectedRoute>
        } />

        <Route path="/report/:assetId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <QuickReportHandler />
          </ProtectedRoute>
        } />

        <Route path="/report-room/:roomId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <RoomReportHandler />
          </ProtectedRoute>
        } />

        <Route path="/report-classroom/:classroomId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <ClassroomReportHandler />
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
      scope="college"
    />
  );
};

const RoomReportHandler = () => {
  const { roomId } = useParams();

  return (
    <HostelDashboard
      prefilledRoomId={roomId}
      autoOpenForm={true}
    />
  );
};

const ClassroomReportHandler = () => {
  const { classroomId } = useParams();

  return (
    <StudentDashboard
      prefilledClassroomId={classroomId}
      autoOpenForm={true}
      scope="classroom"
    />
  );
};


export default App;
