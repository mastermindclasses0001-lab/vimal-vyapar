import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        
        {/* Admin Strictly Protected Routes */}
        <Route path="/customers" element={<ProtectedRoute roleRequired="admin"><Customers /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roleRequired="admin"><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roleRequired="admin"><Settings /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}