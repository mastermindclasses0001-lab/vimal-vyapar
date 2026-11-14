import { useState } from 'react';
import { Users, Plus, Search, Download } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');

  const customerData = [
    { id: 'C001', name: 'Rahul Sharma', mobile: '9876543210', address: 'Barganda, Giridih, 815301', total_purchases: '₹ 45,000', last_visit: '2026-11-14' },
    { id: 'C002', name: 'Neha Singh', mobile: '9988776655', address: 'Makarpur, Giridih', total_purchases: '₹ 12,400', last_visit: '2026-11-14' },
    { id: 'C003', name: 'Amit Kumar', mobile: '9123456780', address: 'Pachamba, Giridih', total_purchases: '₹ 8,500', last_visit: '2026-11-10' },
  ];

  const handleExport = () => {
    exportToExcel(customerData, 'Vimal_Vyapar_Customer_Directory');
  };

  const filteredData = customerData.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobile.includes(searchTerm)
  );

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users color="#eab308" size={32} /> Customer Directory
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExport} className="btn-outline">
            <Download size={18} /> Export Customer Data
          </button>
          <button className="btn-success">
            <Plus size={18} /> Add Customer
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Search color="#888" />
        <input 
          type="text" 
          placeholder="Search by Customer Name or Mobile Number..." 
          style={{ margin: 0, border: 'none', background: 'transparent' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer Name</th>
              <th>Mobile Number</th>
              <th>Address</th>
              <th>Total Purchases</th>
              <th>Last Visit</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(c => (
              <tr key={c.id}>
                <td style={{ color: '#888' }}>{c.id}</td>
                <td style={{ fontWeight: 'bold', color: '#38bdf8' }}>{c.name}</td>
                <td>{c.mobile}</td>
                <td>{c.address}</td>
                <td style={{ color: '#22c55e', fontWeight: 'bold' }}>{c.total_purchases}</td>
                <td>{c.last_visit}</td>
                <td>
                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>View History</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}