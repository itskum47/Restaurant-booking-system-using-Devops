import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles = null, requiredRole = null }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0A0A0B',
        color: '#F5F0E8',
        fontSize: '18px',
      }}>
        ⏳ Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const allowedRoles = requiredRole ? [requiredRole] : roles;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={user?.role === 'owner' ? '/dashboard' : '/chat'} replace />;
  }

  return children;
}
