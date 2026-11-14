import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Store, Cloud } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { currentUser } = useAuth();
  const [storeData, setStoreData] = useState({
    storeName: 'VIMAL VYAPAR',
    tagline: 'A PRODUCT OF BHRIVIM LAB',
    address: 'Barganda, Giridih, Jharkhand',
    gstin: '',
    driveLink: ''
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
      alert("✅ Settings saved! It will reflect permanently across the software.");
    } catch (error) {
      alert("Error saving: " + error.message);
    }
    setLoading(false);
  };

  if (currentUser?.role !== 'admin') return null;

  return (
    <div className="no-print" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
        <SettingsIcon color="#eab308" size={32} />
        <h1 style={{ color: '#fff', margin: 0 }}>System Settings (Admin Only)</h1>
      </div>
      
      <div className="card">
        <h3 style={{ color: '#38bdf8', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={20} /> Store Identity & Invoice Setup
        </h3>
        
        <form onSubmit={handleSave}>
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Store Name</label>
          <input type="text" required value={storeData.storeName} onChange={e => setStoreData({...storeData, storeName: e.target.value})} />
          
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Tagline / Subheading</label>
          <input type="text" value={storeData.tagline} onChange={e => setStoreData({...storeData, tagline: e.target.value})} />
          
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Full Address (For Print)</label>
          <input type="text" required value={storeData.address} onChange={e => setStoreData({...storeData, address: e.target.value})} />
          
          <label style={{color:'#eab308', fontSize:'12px', textTransform:'uppercase', fontWeight: 'bold'}}>GSTIN Number (Optional)</label>
          <input type="text" placeholder="e.g. 20XXXXX1234X1Z5" value={storeData.gstin} onChange={e => setStoreData({...storeData, gstin: e.target.value})} style={{ border: '1px solid #eab308' }} />
          
          <h3 style={{ color: '#22c55e', margin: '30px 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #333', paddingTop:'20px' }}>
            <Cloud size={20} /> Google Drive Cloud Backup Integration
          </h3>
          <p style={{color:'#888', fontSize:'13px', marginBottom:'15px'}}>
            Paste your Google Drive Folder Link below for the 1-Click Auto Backup on the Dashboard.
          </p>
          <label style={{color:'#22c55e', fontSize:'12px', textTransform:'uppercase', fontWeight: 'bold'}}>Google Drive Folder Link</label>
          <input type="url" placeholder="https://drive.google.com/drive/folders/..." value={storeData.driveLink || ''} onChange={e => setStoreData({...storeData, driveLink: e.target.value})} style={{ border: '1px solid #22c55e' }} />

          <button type="submit" disabled={loading} className="btn-success" style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}>
            <Save size={18} /> {loading ? 'Saving...' : 'Save Settings Permanently'}
          </button>
        </form>
      </div>
    </div>
  );
}