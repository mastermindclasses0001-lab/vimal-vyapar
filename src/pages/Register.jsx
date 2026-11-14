import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'seller' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setError('');
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: form.name,
        email: form.email,
        role: form.role,
        createdAt: new Date()
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message.replace('Firebase: ', '')); 
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '20px' }}>
      <div className="card" style={{ width: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          <UserPlus color="#22c55e" size={32} />
          <h2 style={{ margin: 0, color: '#fff' }}>Create Account</h2>
        </div>
        {error && <p style={{ color: '#ef4444', textAlign: 'center', background: '#450a0a', padding: '10px', borderRadius: '6px' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input type="email" placeholder="Email Address" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input type="password" placeholder="Password (Min 6 chars)" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          <input type="password" placeholder="Confirm Password" required value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} />
          <label style={{color:'#888', marginBottom:'5px', display:'block'}}>Assign Role:</label>
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="seller">Seller / Cashier</option>
            <option value="inventory">Inventory Manager</option>
            <option value="admin">System Admin</option>
          </select>
          <button className="btn-success" type="submit" style={{ width: '100%', fontSize: '16px', padding: '14px', marginTop: '10px', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Creating...' : 'Register User'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
          Already registered? <Link to="/login" style={{ color: '#eab308' }}>Login Here</Link>
        </p>
      </div>
    </div>
  );
}