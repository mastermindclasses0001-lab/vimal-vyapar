import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { currentUser } = useAuth();
  const [storeData, setStoreData] = useState({
    storeName: 'VIMAL VYAPAR',
    tagline: 'A PRODUCT OF BHRIVIMLAB',
    address: 'Barganda, Giridih, Jharkhand - 815301',
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
      alert("✅ Store details updated successfully!");
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
        <h1 style={{ color: '#fff', margin: 0 }}>Store Settings</h1>
      </div>
      
      <div className="card">
        <h3 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '20px' }}>Invoice Header Configuration</h3>
        <form onSubmit={handleSave}>
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Store Name</label>
          <input type="text" required value={storeData.storeName} onChange={e => setStoreData({...storeData, storeName: e.target.value})} />
          
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Tagline / Subheading</label>
          <input type="text" value={storeData.tagline} onChange={e => setStoreData({...storeData, tagline: e.target.value})} />
          
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Full Address</label>
          <input type="text" required value={storeData.address} onChange={e => setStoreData({...storeData, address: e.target.value})} />
          
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase', color: '#eab308', fontWeight: 'bold'}}>GSTIN Number</label>
          <input type="text" placeholder="e.g. 20XXXXX1234X1Z5" value={storeData.gstin} onChange={e => setStoreData({...storeData, gstin: e.target.value})} style={{ border: '1px solid #eab308' }} />
          
          <button type="submit" disabled={loading} className="btn-success" style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}>
            <Save size={18} /> {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
