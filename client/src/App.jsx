import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';

import Landing from './pages/Landing';
import Login from './pages/Login';
import AuthorityLogin from './pages/AuthorityLogin';
import Register from './pages/Register';
import Feed from './pages/Feed';
import NewReport from './pages/NewReport';
import ReportDetail from './pages/ReportDetail';
import Profile from './pages/Profile';
import AuthorityDashboard from './pages/AuthorityDashboard';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center text-sm font-mono">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

function AuthorityRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-sm font-mono">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'authority') return <Navigate to="/feed" replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/authority/login" element={<AuthorityLogin />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/feed"
          element={
            <PrivateRoute>
              <Feed />
            </PrivateRoute>
          }
        />
        <Route
          path="/report/new"
          element={
            <PrivateRoute>
              <NewReport />
            </PrivateRoute>
          }
        />
        <Route path="/report/:id" element={<ReportDetail />} />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/authority"
          element={
            <AuthorityRoute>
              <AuthorityDashboard />
            </AuthorityRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

