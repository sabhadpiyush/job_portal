import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './ui';

// Blocks a route unless the user is logged in (and, optionally, has the right role)
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
