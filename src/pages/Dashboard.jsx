import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, Package, AlertTriangle, TrendingUp, ShoppingCart, Download, Store, Cloud } from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { exportToExcel } from '../utils/excelExport';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  
  const [stats, setStats] = useState({ sales: 0, profit: 0, active: 0, lowStock: 0 });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driveLink, setDriveLink] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Settings for Drive Link
        if(isAdmin) {
           const sSnap = await getDoc(doc(db, 'settings', 'storeDetails'));
           if(sSnap.exists() && sSnap.data().driveLink) setDriveLink(sSnap.data().driveLink);
        }

        const pSnap = await getDocs(collection(db, "products"));
        let active = 0;
        let low = [];
        pSnap.forEach(doc => {
          const data = doc.data();
          active++;
          if(Number(data.stock) <= Number(data.min_stock)) {
            low.push({ id: doc.id, ...data });
          }
        });

        const iSnap = await getDocs(query(collection(db, "invoices"), orderBy("timestamp", "desc")));
        let tSales = 0;
        let tProfit = 0;
        let txs = [];
        const todayStr = new Date().toLocaleDateString('en-IN');

        iSnap.forEach(doc => {
          const data = doc.data();
          if(data.date === todayStr) {
            tSales += Number(data.grandTotal || 0);
            let cogs = 0;
            data.items?.forEach(item => {
              cogs += (Number(item.purchase_price || 0) * Number(item.qty || 1));
            });
            tProfit += (Number(data.totalTaxable || 0) - cogs);
          }
          txs.push({
            id: data.invoiceNo || doc.id,
            customer: data.customer?.name || data.customer?.mobile || 'Walk-in',
            time: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString('en-IN') : '',
            amount: data.grandTotal,
            date: data.date,
            seller: data.sellerName || 'Admin'
          });
        });

        setStats({ sales: tSales, profit: tProfit, active, lowStock: low.length });
        setLowStockItems(low);
        setRecentTx(txs);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, [isAdmin]);

  const handleDriveBackup = () => {
    // 1. Export today's transactions to Excel
    const todaysTx = recentTx.filter(tx => tx.date === new Date().toLocaleDateString('en-IN'));
    exportToExcel(todaysTx.length > 0 ? todaysTx : [{Message: 'No Sales Today'}], `Daily_Backup_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}`);
    
    // 2. Open Drive Link
    if (driveLink) {
       window.open(driveLink, '_blank');
    } else {
       alert("Google Drive ka link Settings me nahi dala gaya hai. Kripya Settings me jaakar Drive Folder ka link set karein.");
    }
  };

  if (loading) return <div style={{padding: '40px', color: '#eab308'}}>Loading Real-Time Data...</div>;

  return (
    <div className="no-print" style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* BRANDING HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ color: '#eab308', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Store size={32} color="#eab308"/> EXECUTIVE DASHBOARD
          </h1>
          <p style={{ color: '#888', margin: '10px 0 0 0' }}>Welcome, <strong style={{ color: '#fff', textTransform:'capitalize' }}>{currentUser?.name}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && (
            <button onClick={handleDriveBackup} className="btn-success" style={{background: '#4285F4', border:'none'}}>
              <Cloud size={18} /> 1-Click Drive Backup
            </button>
          )}
          <Link to="/billing" className="btn-primary" style={{textDecoration: 'none'}}><ShoppingCart size={18} /> New Sale</Link>
        </div>
      </div>
      
      {/* ADMIN STATS CARDS */}
      {isAdmin && (
        <div className="grid-4">
          <div className="card" style={{ borderTop: `4px solid #38bdf8`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ color: '#888', margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase' }}>Today's Sales</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#fff' }}>₹ {stats.sales.toLocaleString('en-IN', {maximumFractionDigits:0})}</p>
            </div>
            <div style={{ background: '#222', padding: '16px', borderRadius: '50%' }}><IndianRupee size={24} color="#38bdf8" /></div>
          </div>
          <div className="card" style={{ borderTop: `4px solid #eab308`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ color: '#888', margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase' }}>Today's Profit</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#fff' }}>₹ {stats.profit.toLocaleString('en-IN', {maximumFractionDigits:0})}</p>
            </div>
            <div style={{ background: '#222', padding: '16px', borderRadius: '50%' }}><TrendingUp size={24} color="#eab308" /></div>
          </div>
          <div className="card" style={{ borderTop: `4px solid #22c55e`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ color: '#888', margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase' }}>Active Products</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#fff' }}>{stats.active} Items</p>
            </div>
            <div style={{ background: '#222', padding: '16px', borderRadius: '50%' }}><Package size={24} color="#22c55e" /></div>
          </div>
          <div className="card" style={{ borderTop: `4px solid #ef4444`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ color: '#888', margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase' }}>Stock Alerts</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#fff' }}>{stats.lowStock} Alerts</p>
            </div>
            <div style={{ background: '#222', padding: '16px', borderRadius: '50%' }}><AlertTriangle size={24} color="#ef4444" /></div>
          </div>
        </div>
      )}

      {/* SELLER STATS (Limited View) */}
      {!isAdmin && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{color: '#eab308'}}>Billing Portal Active</h2>
          <p style={{color: '#888'}}>You are logged in as a Seller. Access to financial data is restricted.</p>
          <Link to="/billing" className="btn-success" style={{textDecoration: 'none', marginTop:'10px'}}><ShoppingCart size={18} /> Enter POS Terminal</Link>
        </div>
      )}

      <div className="grid-2" style={{ marginTop: '24px' }}>
        <div className="card">
          <h2 style={{ marginTop: 0, color: '#eab308', display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingUp /> Recent Invoices</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  {isAdmin && <th style={{color:'#38bdf8'}}>Billed By</th>}
                </tr>
              </thead>
              <tbody>
                {recentTx.slice(0, 10).map((tx, i) => (
                  <tr key={i}>
                    <td style={{ color: '#38bdf8' }}>{tx.id}</td>
                    <td>{tx.customer}<br/><small style={{color:'#888'}}>{tx.date}</small></td>
                    <td style={{ fontWeight: 'bold' }}>₹ {Number(tx.amount).toLocaleString('en-IN')}</td>
                    {isAdmin && <td style={{textTransform:'capitalize', color:'#22c55e'}}>{tx.seller}</td>}
                  </tr>
                ))}
                {recentTx.length === 0 && <tr><td colSpan={isAdmin ? 4 : 3} style={{textAlign: 'center', color: '#888'}}>No transactions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts - Admins Only or Inventory Managers */}
        {currentUser.role !== 'seller' && (
          <div className="card">
            <h2 style={{ marginTop: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}><AlertTriangle /> Reorder Alerts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
              {lowStockItems.map((item) => (
                <div key={item.id} style={{ background: '#222', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                  <h4 style={{ margin: '0 0 8px 0', color:'#fff' }}>{item.name}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '14px' }}>
                    <span>Stock: <strong style={{ color: '#ef4444', fontSize:'18px' }}>{item.stock} left</strong> (Min: {item.min_stock})</span>
                  </div>
                </div>
              ))}
              {lowStockItems.length === 0 && <div style={{color: '#888'}}>All stocks are healthy!</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}