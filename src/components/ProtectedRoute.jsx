import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roleRequired }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) return <Navigate to="/login" />;
  
  if (roleRequired && currentUser.role !== 'admin' && currentUser.role !== roleRequired) {
     return <Navigate to="/dashboard" />;
  }

  return children;
}