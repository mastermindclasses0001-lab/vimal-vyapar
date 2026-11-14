import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Store } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { currentUser } = useAuth();
  const [storeData, setStoreData] = useState({
    storeName: 'YOUR STORE NAME',
    tagline: 'YOUR SUBHEADING HERE',
    address: 'Your Full Address',
    gstin: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStoreData = async () => {
      const docRef = doc(db, 'settings', 'storeDetails');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setStoreData(docSnap.data());
      }
    };
    fetchStoreData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'storeDetails'), storeData);
      alert("✅ Store details updated successfully! Refresh the page to see changes in Navbar.");
    } catch (error) {
      alert("Error saving details: " + error.message);
    }
    setLoading(false);
  };

  if (currentUser?.role !== 'admin') {
    return <div style={{ padding: '40px', color: '#fff', textAlign: 'center' }}>Access Denied. Admins only.</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
        <SettingsIcon color="#eab308" size={32} />
        <h1 style={{ color: '#fff', margin: 0 }}>System Settings</h1>
      </div>
      
      <div className="card">
        <h3 style={{ color: '#38bdf8', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={20} /> Store Identity & Invoice Configuration
        </h3>
        <p style={{color:'#888', fontSize:'14px', marginBottom:'24px'}}>These details will appear on the top navigation bar and on every GST Invoice you generate.</p>
        
        <form onSubmit={handleSave}>
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Store / Shop Name</label>
          <input type="text" required value={storeData.storeName} onChange={e => setStoreData({...storeData, storeName: e.target.value})} />
          
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Tagline / Subheading</label>
          <input type="text" value={storeData.tagline} onChange={e => setStoreData({...storeData, tagline: e.target.value})} />
          
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Full Address (For Invoice Print)</label>
          <input type="text" required value={storeData.address} onChange={e => setStoreData({...storeData, address: e.target.value})} />
          
          <label style={{color:'#eab308', fontSize:'12px', textTransform:'uppercase', fontWeight: 'bold'}}>GSTIN Number (Leave blank if not applicable)</label>
          <input type="text" placeholder="e.g. 20XXXXX1234X1Z5" value={storeData.gstin} onChange={e => setStoreData({...storeData, gstin: e.target.value})} style={{ border: '1px solid #eab308' }} />
          
          <button type="submit" disabled={loading} className="btn-success" style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}>
            <Save size={18} /> {loading ? 'Saving to Database...' : 'Save Settings Permanently'}
          </button>
        </form>
      </div>
    </div>
  );
}