import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Store, ShieldAlert } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState('VIMAL VYAPAR');

  const [showAdminBox, setShowAdminBox] = useState(false);
  const [adminPin, setAdminPin] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'settings', 'storeDetails'));
      if(snap.exists() && snap.data().storeName) setStoreName(snap.data().storeName);
    };
    fetchSettings();
  }, []);

  const handleAdminSetup = async (e) => {
    e.preventDefault();
    if (adminPin !== '525077') {
       setError("Galat Admin PIN! Access Denied.");
       return;
    }

    setLoading(true);
    setError('');
    try {
      const adminEmail = "admin@vimalvyapar.com";
      const adminPass = "525077"; 
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      } catch (err) {
        const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
        await setDoc(doc(db, 'users', cred.user.uid), { uid: cred.user.uid, name: 'Main Admin', email: adminEmail, role: 'admin', createdAt: new Date() });
      }
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formattedEmail = `${username.toLowerCase().trim()}@vimalvyapar.com`;
      await signInWithEmailAndPassword(auth, formattedEmail, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid Username or Password');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Store size={64} color="#eab308" style={{ marginBottom: '10px' }} />
        <h1 style={{ color: '#eab308', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>{storeName}</h1>
        <h3 style={{ color: '#38bdf8', margin: 0, letterSpacing: '4px' }}>SECURE LOGIN</h3>
      </div>
      
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '30px' }}>
        {error && <p style={{ color: '#ef4444', textAlign: 'center', background: '#450a0a', padding: '10px', borderRadius: '6px' }}>{error}</p>}

        {!showAdminBox ? (
          <>
            <form onSubmit={handleLogin}>
              <label style={{color: '#888', fontSize: '12px', textTransform: 'uppercase'}}>Seller Username</label>
              <input type="text" placeholder="Enter Username" required value={username} onChange={e => setUsername(e.target.value)} />
              
              <label style={{color: '#888', fontSize: '12px', textTransform: 'uppercase'}}>Password</label>
              <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
              
              <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '14px', marginTop: '10px' }} disabled={loading}>
                {loading ? 'Authenticating...' : 'Login to POS Terminal'}
              </button>
            </form>

            <div style={{ marginTop: '30px', borderTop: '1px solid #333', paddingTop: '20px', textAlign: 'center' }}>
              <p style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>Owner / Admin Access</p>
              <button onClick={() => setShowAdminBox(true)} className="btn btn-outline" style={{ width: '100%', color: '#ef4444', borderColor: '#ef4444' }}>
                <ShieldAlert size={16} /> Login as Admin
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleAdminSetup}>
            <h3 style={{color: '#ef4444', textAlign: 'center', marginTop: 0}}>Admin Verification</h3>
            <p style={{color: '#888', textAlign: 'center', fontSize: '12px', marginBottom: '20px'}}>Enter secret 6-digit PIN to unlock.</p>
            
            <input type="password" placeholder="******" required autoFocus value={adminPin} onChange={e => setAdminPin(e.target.value)} style={{ textAlign: 'center', letterSpacing: '10px', fontSize: '24px', fontWeight: 'bold' }} />
            
            <button className="btn btn-danger" type="submit" style={{ width: '100%', padding: '14px', marginTop: '10px' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Unlock Admin Panel'}
            </button>
            
            <button type="button" onClick={() => {setShowAdminBox(false); setError(''); setAdminPin('');}} className="btn btn-outline" style={{ width: '100%', marginTop: '10px', color: '#888', borderColor: '#333' }}>
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}