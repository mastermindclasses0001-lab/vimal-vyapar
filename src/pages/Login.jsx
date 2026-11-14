import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Store, ShieldAlert } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState('VIMAL VYAPAR');

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'settings', 'storeDetails'));
      if(snap.exists() && snap.data().storeName) setStoreName(snap.data().storeName);
    };
    fetchSettings();
  }, []);

  const handleAdminSetup = async () => {
    setLoading(true);
    try {
      // Secret Hardcoded Admin Login
      const adminEmail = "admin@vimalvyapar.com";
      const adminPass = "525077";
      
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      } catch (err) {
        // If not exists, create it
        const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid, name: 'Main Admin', email: adminEmail, role: 'admin', createdAt: new Date()
        });
      }
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if(password === '525077') {
      return handleAdminSetup(); // Bypass for admin
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Store size={64} color="#eab308" style={{ marginBottom: '10px' }} />
        <h1 style={{ color: '#eab308', margin: 0, fontSize: '48px', letterSpacing: '2px', textTransform: 'uppercase' }}>{storeName}</h1>
        <h3 style={{ color: '#38bdf8', margin: 0, letterSpacing: '4px' }}>SECURE LOGIN</h3>
      </div>
      <div className="card" style={{ width: '400px', padding: '40px' }}>
        {error && <p style={{ color: '#ef4444', textAlign: 'center', background: '#450a0a', padding: '10px', borderRadius: '6px' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email Address (Salesman)" required value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn-primary" type="submit" style={{ width: '100%', fontSize: '18px', padding: '14px', marginTop: '10px', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Login to System'}
          </button>
        </form>

        <div style={{ marginTop: '30px', borderTop: '1px solid #333', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>Admin Quick Access (Password: 525077)</p>
          <button onClick={handleAdminSetup} className="btn-outline" style={{ width: '100%', justifyContent: 'center', color: '#ef4444', borderColor: '#ef4444' }}>
            <ShieldAlert size={16} /> Login as Admin
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#888' }}>
          New Salesman? <Link to="/register" style={{ color: '#eab308' }}>Register Here</Link>
        </p>
      </div>
    </div>
  );
}