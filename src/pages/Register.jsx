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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setError('');
    
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
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#eab308', margin: 0, fontSize: '36px' }}>VIMAL VYAPAR</h1>
        <h3 style={{ color: '#38bdf8', margin: 0, letterSpacing: '2px', fontSize: '14px' }}>ULTRA LEVEL POS</h3>
      </div>
      <div className="card" style={{ width: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          <UserPlus color="#22c55e" />
          <h2 style={{ margin: 0, color: '#fff' }}>Create Account</h2>
        </div>
        
        {error && <p style={{ color: '#ef4444', textAlign: 'center', background: '#450a0a', padding: '10px', borderRadius: '6px' }}>{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <input placeholder="Full Name" required value={form.name} onChange={set('name')} />
          <input type="email" placeholder="Email Address" required value={form.email} onChange={set('email')} />
          <input type="password" placeholder="Password (Min 6 chars)" required value={form.password} onChange={set('password')} />
          <input type="password" placeholder="Confirm Password" required value={form.confirm} onChange={set('confirm')} />
          
          <label style={{color:'#888', marginBottom:'5px', display:'block'}}>Assign Role:</label>
          <select value={form.role} onChange={set('role')}>
            <option value="seller">Seller / Cashier</option>
            <option value="inventory">Inventory Manager</option>
            <option value="admin">System Admin</option>
          </select>

          <button className="btn-success" type="submit" style={{ width: '100%', fontSize: '16px', padding: '14px', marginTop: '10px', justifyContent: 'center' }}>Create User</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
          Already registered? <Link to="/login" style={{ color: '#eab308' }}>Login Here</Link>
        </p>
      </div>
    </div>
  );
}