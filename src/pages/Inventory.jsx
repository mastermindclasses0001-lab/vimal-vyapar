import { useState } from 'react';
import { Package, Plus, Search, Download, AlertCircle } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');

  // Enhanced Inventory Data
  const inventoryData = [
    { barcode: '890101', name: 'Premium Rice 25kg', category: 'Grocery', mrp: 1500, purchase_price: 1200, gst_rate: '5%', stock: 2, min_stock: 5 },
    { barcode: '890102', name: 'Refined Oil 15L', category: 'Grocery', mrp: 2100, purchase_price: 1800, gst_rate: '5%', stock: 1, min_stock: 10 },
    { barcode: '890103', name: 'Sony Bravia 55"', category: 'Electronics', mrp: 65000, purchase_price: 55000, gst_rate: '28%', stock: 12, min_stock: 3 },
    { barcode: '890104', name: 'Logitech Mouse', category: 'Electronics', mrp: 850, purchase_price: 500, gst_rate: '18%', stock: 45, min_stock: 10 },
    { barcode: '890105', name: 'Wheat Flour 10kg', category: 'Grocery', mrp: 450, purchase_price: 350, gst_rate: '5%', stock: 50, min_stock: 15 },
  ];

  const handleExport = () => {
    exportToExcel(inventoryData, 'Vimal_Vyapar_Complete_Inventory');
  };

  const filteredData = inventoryData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.barcode.includes(searchTerm)
  );

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Package color="#22c55e" size={32} /> Advanced Inventory
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExport} className="btn-outline">
            <Download size={18} /> Export Excel
          </button>
          <button className="btn-success">
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Search color="#888" />
        <input 
          type="text" 
          placeholder="Search products by Name or Barcode..." 
          style={{ margin: 0, border: 'none', background: 'transparent' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Barcode</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Purchase Rate</th>
              <th>MRP</th>
              <th>GST %</th>
              <th>Live Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => {
              const isLow = item.stock <= item.min_stock;
              return (
                <tr key={item.barcode}>
                  <td style={{ color: '#888' }}>{item.barcode}</td>
                  <td style={{ fontWeight: 'bold', color: '#38bdf8' }}>{item.name}</td>
                  <td>{item.category}</td>
                  <td>₹ {item.purchase_price}</td>
                  <td style={{ color: '#eab308' }}>₹ {item.mrp}</td>
                  <td>{item.gst_rate}</td>
                  <td>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: isLow ? '#ef4444' : '#fff' }}>
                      {item.stock}
                    </span>
                  </td>
                  <td>
                    {isLow ? 
                      <span className="status-badge" style={{ background: '#450a0a', color: '#f87171', display:'flex', alignItems:'center', gap:'4px' }}>
                        <AlertCircle size={12} /> Low Stock
                      </span> : 
                      <span className="status-badge" style={{ background: '#064e3b', color: '#34d399' }}>Healthy</span>
                    }
                  </td>
                  <td>
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Edit</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}