import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Store, Cloud, UserPlus, Users, Key } from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, signOut } from 'firebase/auth';
import { db, secondaryAuth } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { currentUser } = useAuth();
  const [storeData, setStoreData] = useState({
    storeName: 'VIMAL VYAPAR', tagline: 'A PRODUCT OF BHRIVIM LAB', address: 'Barganda, Giridih, Jharkhand', gstin: '', driveLink: ''
  });
  
  const [sellers, setSellers] = useState([]);
  const [newSeller, setNewSeller] = useState({ username: '', name: '', phone: '', address: '', password: '' });
  
  const [loading, setLoading] = useState(false);
  const [sellerLoading, setSellerLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, 'settings', 'storeDetails'));
      if (docSnap.exists()) setStoreData(docSnap.data());
    };
    const fetchSellers = async () => {
      const sSnap = await getDocs(collection(db, "users"));
      const sList = [];
      sSnap.forEach(doc => {
        if(doc.data().role === 'seller') sList.push({ id: doc.id, ...doc.data() });
      });
      setSellers(sList);
    };
    fetchSettings();
    fetchSellers();
  }, []);

  const handleSaveStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'storeDetails'), storeData);
      alert("✅ Store Settings saved successfully!");
    } catch (error) {
      alert("Error saving: " + error.message);
    }
    setLoading(false);
  };

  const handleAddSeller = async (e) => {
    e.preventDefault();
    if(newSeller.password.length < 6) return alert("Password must be at least 6 characters");
    setSellerLoading(true);
    try {
      const formattedEmail = `${newSeller.username.toLowerCase().trim()}@vimalvyapar.com`;
      const cred = await createUserWithEmailAndPassword(secondaryAuth, formattedEmail, newSeller.password);
      
      const newUserData = {
        uid: cred.user.uid,
        username: newSeller.username.toLowerCase().trim(),
        name: newSeller.name,
        phone: newSeller.phone,
        address: newSeller.address,
        role: 'seller',
        passcode: newSeller.password, 
        createdAt: new Date()
      };
      
      await setDoc(doc(db, 'users', cred.user.uid), newUserData);
      await signOut(secondaryAuth);
      
      alert(`✅ Seller ${newSeller.name} added successfully!`);
      setSellers([...sellers, {id: cred.user.uid, ...newUserData}]);
      setNewSeller({ username: '', name: '', phone: '', address: '', password: '' });
    } catch (error) {
      alert("Error adding seller: " + error.message.replace('Firebase: ', ''));
    }
    setSellerLoading(false);
  };

  const handleChangePassword = async (sellerId, username, oldPass) => {
    const newPass = prompt(`Enter new password for ${username} (min 6 chars):`);
    if(!newPass || newPass.length < 6) return alert("Invalid or too short password.");
    
    try {
      const formattedEmail = `${username}@vimalvyapar.com`;
      await signInWithEmailAndPassword(secondaryAuth, formattedEmail, oldPass);
      await updatePassword(secondaryAuth.currentUser, newPass);
      await updateDoc(doc(db, 'users', sellerId), { passcode: newPass });
      await signOut(secondaryAuth);
      
      alert("✅ Password updated successfully! Seller must use new password to login.");
      setSellers(sellers.map(s => s.id === sellerId ? {...s, passcode: newPass} : s));
    } catch(err) {
      alert("Error updating password: " + err.message);
      await signOut(secondaryAuth);
    }
  };

  if (currentUser?.role !== 'admin') return null;

  return (
    <div className="no-print main-container grid-2">
      
      <div style={{ gridColumn: '1 / -1' }} className="header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SettingsIcon color="#eab308" size={32} />
          <h1 style={{ color: '#fff', margin: 0 }}>System Settings (Admin Panel)</h1>
        </div>
      </div>
      
      {/* STORE SETTINGS */}
      <div className="card" style={{ height: 'fit-content' }}>
        <h3 style={{ color: '#38bdf8', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={20} /> Store Identity & Invoice Setup
        </h3>
        
        <form onSubmit={handleSaveStore}>
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Store Name</label>
          <input type="text" required value={storeData.storeName} onChange={e => setStoreData({...storeData, storeName: e.target.value})} />
          
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Tagline / Subheading</label>
          <input type="text" value={storeData.tagline} onChange={e => setStoreData({...storeData, tagline: e.target.value})} />
          
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Full Address (For Print)</label>
          <input type="text" required value={storeData.address} onChange={e => setStoreData({...storeData, address: e.target.value})} />
          
          <label style={{color:'#eab308', fontSize:'12px', textTransform:'uppercase', fontWeight: 'bold'}}>GSTIN Number (Optional)</label>
          <input type="text" placeholder="e.g. 20XXXXX1234X1Z5" value={storeData.gstin} onChange={e => setStoreData({...storeData, gstin: e.target.value})} style={{ border: '1px solid #eab308' }} />
          
          <h3 style={{ color: '#22c55e', margin: '30px 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #333', paddingTop:'20px' }}>
            <Cloud size={20} /> Google Drive Cloud Backup
          </h3>
          <input type="url" placeholder="Drive Folder Link..." value={storeData.driveLink || ''} onChange={e => setStoreData({...storeData, driveLink: e.target.value})} style={{ border: '1px solid #22c55e' }} />

          <button type="submit" disabled={loading} className="btn btn-success" style={{ width: '100%', marginTop: '10px' }}>
            <Save size={18} /> {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* STAFF MANAGEMENT */}
      <div className="card" style={{ height: 'fit-content' }}>
        <h3 style={{ color: '#eab308', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} /> Staff / Seller Management
        </h3>
        <p style={{color:'#888', fontSize:'13px', marginBottom:'20px'}}>Create seller accounts. Sellers login using their Username and Password.</p>
        
        <form onSubmit={handleAddSeller} className="form-grid">
          <div style={{ gridColumn: '1 / -1' }}><label style={{ color: '#888', fontSize: '12px' }}>Full Name</label><input required value={newSeller.name} onChange={e => setNewSeller({...newSeller, name: e.target.value})} style={{ marginBottom: 0 }} /></div>
          <div><label style={{ color: '#888', fontSize: '12px', color:'#38bdf8' }}>Login Username</label><input required placeholder="e.g. ramu" value={newSeller.username} onChange={e => setNewSeller({...newSeller, username: e.target.value})} style={{ marginBottom: 0, border:'1px solid #38bdf8' }} /></div>
          <div><label style={{ color: '#888', fontSize: '12px' }}>Phone Number</label><input required value={newSeller.phone} onChange={e => setNewSeller({...newSeller, phone: e.target.value})} style={{ marginBottom: 0 }} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={{ color: '#888', fontSize: '12px' }}>Home Address</label><input required value={newSeller.address} onChange={e => setNewSeller({...newSeller, address: e.target.value})} style={{ marginBottom: 0 }} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={{ color: '#888', fontSize: '12px', color:'#eab308' }}>Login Password (Min 6 chars)</label><input required type="text" value={newSeller.password} onChange={e => setNewSeller({...newSeller, password: e.target.value})} style={{ marginBottom: 0, border:'1px solid #eab308' }} /></div>
          
          <button type="submit" disabled={sellerLoading} className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>
            <UserPlus size={18} /> {sellerLoading ? 'Adding...' : 'Add New Seller'}
          </button>
        </form>

        <h4 style={{ margin: '30px 0 15px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Active Sellers</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
          {sellers.map(s => (
            <div key={s.id} style={{ background: '#000', padding: '15px', borderRadius: '8px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#fff' }}>{s.name}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>User: <span style={{color:'#38bdf8'}}>{s.username}</span> | Ph: {s.phone}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>Pass: <span style={{color:'#eab308'}}>{s.passcode}</span></div>
              </div>
              <button onClick={() => handleChangePassword(s.id, s.username, s.passcode)} className="btn btn-outline" style={{ padding: '8px' }} title="Change Password">
                <Key size={16} />
              </button>
            </div>
          ))}
          {sellers.length === 0 && <p style={{color:'#888', textAlign:'center'}}>No sellers added yet.</p>}
        </div>
      </div>
    </div>
  );
}