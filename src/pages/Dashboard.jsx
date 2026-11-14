import { useAuth } from '../context/AuthContext';
import { IndianRupee, Package, AlertTriangle, TrendingUp, Users, ShoppingCart, Download } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function Dashboard() {
  const { currentUser } = useAuth();
  
  // Dummy Data for Preview
  const lowStockItems = [
    { id: '1', name: 'Premium Rice 25kg', stock: 2, min: 5, supplier: 'Agro Foods' },
    { id: '2', name: 'Refined Oil 15L', stock: 1, min: 10, supplier: 'Fortune Traders' },
    { id: '3', name: 'Wheat Flour 10kg', stock: 4, min: 15, supplier: 'Aashirvaad Dist.' }
  ];

  const recentTransactions = [
    { id: 'INV-1001', customer: 'Rahul Sharma', time: '10:45 AM', amount: 4500, profit: 540 },
    { id: 'INV-1002', customer: 'Walk-in', time: '11:15 AM', amount: 850, profit: 120 },
    { id: 'INV-1003', customer: 'Neha Singh', time: '12:30 PM', amount: 12400, profit: 1500 }
  ];

  const stats = [
    { title: "Today's Gross Sales", value: "₹ 17,750", icon: <IndianRupee size={24} color="#38bdf8" />, color: "#38bdf8" },
    { title: "Today's Net Profit", value: "₹ 2,160", icon: <TrendingUp size={24} color="#eab308" />, color: "#eab308" },
    { title: "Active Inventory", value: "842 Items", icon: <Package size={24} color="#22c55e" />, color: "#22c55e" },
    { title: "Low Stock Alerts", value: lowStockItems.length + " Alerts", icon: <AlertTriangle size={24} color="#ef4444" />, color: "#ef4444" }
  ];

  const handleExportSummary = () => {
    exportToExcel(recentTransactions, 'Daily_Sales_Summary');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ color: '#fff', margin: 0 }}>Executive Dashboard</h1>
          <p style={{ color: '#888', margin: '5px 0 0 0' }}>Welcome back, <span style={{ color: '#eab308' }}>{currentUser?.name}</span> ({currentUser?.role})</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
           <button onClick={handleExportSummary} className="btn-outline">
            <Download size={18} /> Export Daily Summary
          </button>
          <button className="btn-primary">
            <ShoppingCart size={18} /> New Sale
          </button>
        </div>
      </div>
      
      <div className="grid-4">
        {stats.map((stat, i) => (
          <div key={i} className="card" style={{ borderTop: `4px solid ${stat.color}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ color: '#888', margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.title}</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#fff' }}>{stat.value}</p>
            </div>
            <div style={{ background: '#222', padding: '16px', borderRadius: '50%' }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0, color: '#eab308', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp /> Today's Transactions
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Customer</th>
                  <th>Time</th>
                  <th>Amount</th>
                  <th>Profit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ color: '#38bdf8' }}>#{tx.id}</td>
                    <td>{tx.customer}</td>
                    <td style={{ color: '#888' }}>{tx.time}</td>
                    <td style={{ fontWeight: 'bold' }}>₹ {tx.amount.toLocaleString()}</td>
                    <td style={{ color: '#eab308' }}>₹ {tx.profit.toLocaleString()}</td>
                    <td><span className="status-badge" style={{ background: '#064e3b', color: '#34d399' }}>Paid</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle /> Reorder Alerts (Low Stock)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {lowStockItems.map((item) => (
              <div key={item.id} style={{ background: '#222', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                <h4 style={{ margin: '0 0 8px 0', color:'#fff' }}>{item.name}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '14px' }}>
                  <span>Stock: <strong style={{ color: '#ef4444', fontSize:'18px' }}>{item.stock} left</strong> (Min: {item.min})</span>
                </div>
                <div style={{color:'#38bdf8', fontSize:'12px', marginTop:'5px'}}>Supplier: {item.supplier}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}