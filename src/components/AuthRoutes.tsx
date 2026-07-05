import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AdminRoute() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return null;

  return user && isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
