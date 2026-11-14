import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingCart, Package, Receipt, Users, LogOut, BarChart3, Settings } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [storeName, setStoreName] = useState('VIMAL VYAPAR');

  useEffect(() => {
    const fetchSettings = async () => {
      if(currentUser) {
        const snap = await getDoc(doc(db, 'settings', 'storeDetails'));
        if(snap.exists() && snap.data().storeName) {
          setStoreName(snap.data().storeName);
        }
      }
    };
    fetchSettings();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!currentUser) return null;

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['admin', 'seller', 'inventory'] },
    { name: 'Billing POS', path: '/billing', icon: <Receipt size={18} />, roles: ['admin', 'seller'] },
    { name: 'Inventory', path: '/inventory', icon: <Package size={18} />, roles: ['admin', 'inventory'] },
    { name: 'Customers', path: '/customers', icon: <Users size={18} />, roles: ['admin'] },
    { name: 'Reports', path: '/reports', icon: <BarChart3 size={18} />, roles: ['admin'] },
  ];

  return (
    <nav className="no-print" style={{ background: '#111', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eab308', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ padding: '16px 0' }}>
        <h2 style={{ margin: 0, color: '#eab308', letterSpacing: '2px', fontSize: '24px', textTransform: 'uppercase' }}>{storeName}</h2>
        <small style={{ color: '#38bdf8', fontSize: '10px', letterSpacing: '2px' }}>PRO EDITION</small>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        {links.filter(link => link.roles.includes(currentUser.role)).map(link => {
          const isActive = location.pathname === link.path;
          return (
            <Link key={link.name} to={link.path} style={{ color: isActive ? '#eab308' : '#fff', display: 'flex', alignItems: 'center', gap: '8px', padding: '24px 16px', borderBottom: isActive ? '3px solid #eab308' : '3px solid transparent', textDecoration: 'none', fontWeight: isActive ? 'bold' : 'normal', transition: '0.2s' }}>
              {link.icon} {link.name}
            </Link>
          )
        })}
        {currentUser.role === 'admin' && (
          <Link to="/settings" style={{ color: location.pathname === '/settings' ? '#eab308' : '#fff', display: 'flex', alignItems: 'center', gap: '8px', padding: '24px 16px', borderBottom: location.pathname === '/settings' ? '3px solid #eab308' : '3px solid transparent', textDecoration: 'none', transition: '0.2s' }}>
            <Settings size={18} /> Settings
          </Link>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#22c55e', fontWeight: 'bold', textTransform: 'capitalize' }}>{currentUser.name}</div>
          <div style={{ color: '#888', fontSize: '12px', textTransform: 'capitalize' }}>{currentUser.role}</div>
        </div>
        <button onClick={handleLogout} className="btn-danger">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
}