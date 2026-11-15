import { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertCircle, X, Trash2, Download } from 'lucide-react';
import { collection, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { exportToExcel } from '../utils/excelExport';

export default function Inventory() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ barcode: '', name: '', category: 'Grocery', purchase_price: '', mrp: '', gst_rate: '0%', stock: '', min_stock: '' });

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    const items = [];
    querySnapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
    setProducts(items);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        ...form,
        purchase_price: Number(form.purchase_price),
        mrp: Number(form.mrp),
        stock: Number(form.stock),
        min_stock: Number(form.min_stock),
        timestamp: new Date()
      });
      setShowModal(false);
      setForm({ barcode: '', name: '', category: 'Grocery', purchase_price: '', mrp: '', gst_rate: '0%', stock: '', min_stock: '' });
      fetchProducts(); 
    } catch (error) {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure?")) {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    }
  };

  const handleExport = () => exportToExcel(products, 'Inventory_Data');
  const filteredData = products.filter(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || item.barcode?.includes(searchTerm));
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="no-print main-container">
      <div className="header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <Package color="#22c55e" size={32} />
           <h1 style={{ color: '#fff', margin: 0 }}>Live Inventory</h1>
        </div>
        <div className="header-actions">
          {isAdmin && <button onClick={handleExport} className="btn btn-outline"><Download size={18} /> Export Excel</button>}
          {isAdmin && <button onClick={() => setShowModal(true)} className="btn btn-success"><Plus size={18} /> Add Product</button>}
        </div>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Search color="#888" />
        <input type="text" placeholder="Search products..." style={{ margin: 0, border: 'none', background: 'transparent' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Barcode</th><th>Product Name</th><th>Category</th>{isAdmin && <th>Purchase Rate</th>}<th>MRP</th><th>GST %</th><th>Live Stock</th><th>Status</th>{isAdmin && <th>Action</th>}</tr>
          </thead>
          <tbody>
            {filteredData.map(item => {
              const isLow = item.stock <= item.min_stock;
              return (
                <tr key={item.id}>
                  <td style={{ color: '#888' }}>{item.barcode}</td>
                  <td style={{ fontWeight: 'bold', color: '#38bdf8' }}>{item.name}</td>
                  <td>{item.category}</td>
                  {isAdmin && <td style={{color: '#ef4444'}}>₹ {item.purchase_price}</td>}
                  <td style={{ color: '#eab308' }}>₹ {item.mrp}</td>
                  <td>{item.gst_rate}</td>
                  <td><span style={{ fontSize: '18px', fontWeight: 'bold', color: isLow ? '#ef4444' : '#fff' }}>{item.stock}</span></td>
                  <td>{isLow ? <span className="status-badge" style={{ background: '#450a0a', color: '#f87171' }}><AlertCircle size={12} style={{display:'inline', verticalAlign:'middle'}}/> Low</span> : <span className="status-badge" style={{ background: '#064e3b', color: '#34d399' }}>Healthy</span>}</td>
                  {isAdmin && <td><button onClick={() => handleDelete(item.id)} className="btn btn-danger" style={{ padding: '6px 12px' }}><Trash2 size={14}/></button></td>}
                </tr>
              )
            })}
            {products.length === 0 && <tr><td colSpan={isAdmin ? 9 : 8} style={{textAlign:'center', color:'#888', padding:'30px'}}>No products in database.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && isAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card modal-card" style={{ width: '500px', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ color: '#eab308', marginTop: 0 }}>Add New Product</h2>
            <form onSubmit={handleSubmit} className="form-grid">
              <div style={{ gridColumn: '1 / -1' }}><label style={{ color: '#888', fontSize: '12px' }}>Product Name</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ marginBottom: 0 }} /></div>
              <div><label style={{ color: '#888', fontSize: '12px' }}>Barcode / HSN</label><input required value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} style={{ marginBottom: 0 }} /></div>
              <div><label style={{ color: '#888', fontSize: '12px' }}>Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ marginBottom: 0 }}><option>Grocery</option><option>Electronics</option><option>Hardware</option><option>Other</option></select></div>
              <div><label style={{ color: '#888', fontSize: '12px' }}>Purchase Rate (₹)</label><input type="number" required value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} style={{ marginBottom: 0 }} /></div>
              <div><label style={{ color: '#888', fontSize: '12px' }}>MRP (₹)</label><input type="number" required value={form.mrp} onChange={e => setForm({...form, mrp: e.target.value})} style={{ marginBottom: 0 }} /></div>
              <div><label style={{ color: '#888', fontSize: '12px' }}>GST Rate</label><select value={form.gst_rate} onChange={e => setForm({...form, gst_rate: e.target.value})} style={{ marginBottom: 0 }}><option>0%</option><option>5%</option><option>12%</option><option>18%</option><option>28%</option></select></div>
              <div><label style={{ color: '#888', fontSize: '12px' }}>Opening Stock</label><input type="number" required value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} style={{ marginBottom: 0 }} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ color: '#888', fontSize: '12px' }}>Low Stock Limit</label><input type="number" required value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})} style={{ marginBottom: 0 }} /></div>
              <button type="submit" className="btn btn-success" style={{ gridColumn: '1 / -1', justifyContent: 'center' }} disabled={loading}>{loading ? 'Saving...' : 'Save Product'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}