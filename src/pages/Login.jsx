import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Store } from 'lucide-react';

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

  const handleLogin = async (e) => {
    e.preventDefault();
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
          <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn-primary" type="submit" style={{ width: '100%', fontSize: '18px', padding: '14px', marginTop: '10px', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Login to System'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', color: '#888' }}>
          New User? <Link to="/register" style={{ color: '#eab308' }}>Register Here</Link>
        </p>
      </div>
    </div>
  );
}