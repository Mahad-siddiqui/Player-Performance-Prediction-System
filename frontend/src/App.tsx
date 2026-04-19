import { Navigate, Outlet, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import FanDashboard from './pages/FanDashboard';

type AppRole = 'admin' | 'manager' | 'fan';

const ROLE_PATHS: Record<AppRole, string> = {
  admin: '/admin',
  manager: '/manager',
  fan: '/fan',
};

function DashboardLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: React.ReactElement;
  allowedRole?: AppRole;
}) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={ROLE_PATHS[user.role as AppRole]} replace />;
  }

  return children;
}

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={ROLE_PATHS[user.role as AppRole]} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<DashboardLayout />}>
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRole="manager">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fan"
          element={
            <ProtectedRoute allowedRole="fan">
              <FanDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
