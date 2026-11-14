import { useState, useEffect } from 'react';
import { Users, Search, Download } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { exportToExcel } from '../utils/excelExport';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      const iSnap = await getDocs(collection(db, "invoices"));
      const cMap = {};

      iSnap.forEach(doc => {
        const data = doc.data();
        if(data.customer && data.customer.mobile) {
          const mob = data.customer.mobile;
          if(!cMap[mob]) {
            cMap[mob] = {
              mobile: mob,
              name: data.customer.name || 'N/A',
              address: data.customer.address || 'N/A',
              total_purchases: 0,
              last_visit: data.date
            };
          }
          cMap[mob].total_purchases += Number(data.grandTotal || 0);
          cMap[mob].last_visit = data.date; 
        }
      });

      setCustomerData(Object.values(cMap));
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  const handleExport = () => {
    exportToExcel(customerData, 'Customer_Database');
  };

  const filteredData = customerData.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobile.includes(searchTerm)
  );

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users color="#eab308" size={32} /> CRM Database
        </h1>
        <button onClick={handleExport} className="btn-outline"><Download size={18} /> Export Data</button>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Search color="#888" />
        <input type="text" placeholder="Search by Mobile or Name..." style={{ margin: 0, border: 'none', background: 'transparent' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="table-container">
        {loading ? <div style={{padding:'20px', color:'#eab308'}}>Loading...</div> : (
          <table>
            <thead>
              <tr><th>Mobile Number</th><th>Customer Name</th><th>Address</th><th>Total Purchases</th><th>Last Visit</th></tr>
            </thead>
            <tbody>
              {filteredData.map((c, i) => (
                <tr key={i}>
                  <td style={{ color: '#888' }}>{c.mobile}</td>
                  <td style={{ fontWeight: 'bold', color: '#38bdf8' }}>{c.name}</td>
                  <td>{c.address}</td>
                  <td style={{ color: '#22c55e', fontWeight: 'bold' }}>₹ {c.total_purchases.toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                  <td>{c.last_visit}</td>
                </tr>
              ))}
              {filteredData.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', color: '#888'}}>No customers found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}