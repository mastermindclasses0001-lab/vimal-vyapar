import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, Package, AlertTriangle, TrendingUp, ShoppingCart, Download } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { exportToExcel } from '../utils/excelExport';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser } = useAuth();
  
  const [stats, setStats] = useState({ sales: 0, profit: 0, active: 0, lowStock: 0 });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
            date: data.date
          });
        });

        setStats({ sales: tSales, profit: tProfit, active, lowStock: low.length });
        setLowStockItems(low);
        setRecentTx(txs.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleExportSummary = () => {
    exportToExcel(recentTx, 'Recent_Sales_Export');
  };

  if (loading) return <div style={{padding: '40px', color: '#eab308'}}>Loading Dashboard...</div>;

  const statCards = [
    { title: "Today's Sales", value: `₹ ${stats.sales.toLocaleString('en-IN', {maximumFractionDigits:0})}`, icon: <IndianRupee size={24} color="#38bdf8" />, color: "#38bdf8" },
    { title: "Today's Profit", value: `₹ ${stats.profit.toLocaleString('en-IN', {maximumFractionDigits:0})}`, icon: <TrendingUp size={24} color="#eab308" />, color: "#eab308" },
    { title: "Active Products", value: `${stats.active} Items`, icon: <Package size={24} color="#22c55e" />, color: "#22c55e" },
    { title: "Stock Alerts", value: `${stats.lowStock} Alerts`, icon: <AlertTriangle size={24} color="#ef4444" />, color: "#ef4444" }
  ];

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ color: '#fff', margin: 0 }}>Executive Dashboard</h1>
          <p style={{ color: '#888', margin: '5px 0 0 0' }}>Welcome back, <span style={{ color: '#eab308' }}>{currentUser?.name}</span></p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
           <button onClick={handleExportSummary} className="btn-outline"><Download size={18} /> Export Daily</button>
          <Link to="/billing" className="btn-primary" style={{textDecoration: 'none'}}><ShoppingCart size={18} /> New Sale</Link>
        </div>
      </div>
      
      <div className="grid-4">
        {statCards.map((stat, i) => (
          <div key={i} className="card" style={{ borderTop: `4px solid ${stat.color}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ color: '#888', margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.title}</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#fff' }}>{stat.value}</p>
            </div>
            <div style={{ background: '#222', padding: '16px', borderRadius: '50%' }}>{stat.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0, color: '#eab308', display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingUp /> Recent Invoices</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Invoice ID</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentTx.map((tx, i) => (
                  <tr key={i}>
                    <td style={{ color: '#38bdf8' }}>{tx.id}</td>
                    <td>{tx.customer}</td>
                    <td style={{ color: '#888' }}>{tx.date}</td>
                    <td style={{ fontWeight: 'bold' }}>₹ {Number(tx.amount).toLocaleString('en-IN')}</td>
                    <td><span className="status-badge" style={{ background: '#064e3b', color: '#34d399' }}>Paid</span></td>
                  </tr>
                ))}
                {recentTx.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', color: '#888'}}>No transactions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

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
      </div>
    </div>
  );
}