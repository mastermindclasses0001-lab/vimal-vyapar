import { useState, useEffect } from 'react';
import { Receipt, Printer, Search, Trash2 } from 'lucide-react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Billing() {
  const [gstType, setGstType] = useState('intra'); // intra = CGST+SGST, inter = IGST
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ mobile: '', name: '', address: '' });
  const [loading, setLoading] = useState(false);

  // 1. Firebase से इन्वेंटरी लाना
  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      const items = [];
      querySnapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setProducts(items);
    };
    fetchProducts();
  }, []);

  // 2. सर्च रिजल्ट्स फ़िल्टर करना
  const searchResults = searchTerm 
    ? products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm))
    : [];

  // 3. कार्ट में आइटम जोड़ना
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    setSearchTerm(''); // ऐड करने के बाद सर्च बार खाली करें
  };

  // 4. कार्ट से हटाना और क्वांटिटी अपडेट करना
  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const updateQty = (id, newQty) => {
    if (newQty < 1) return;
    setCart(cart.map(item => item.id === id ? { ...item, qty: parseInt(newQty) } : item));
  };

  // 5. टैक्स और टोटल कैलकुलेशन (MRP Inclusive GST)
  let totalTaxable = 0;
  let totalTaxAmount = 0;
  let grandTotal = 0;

  cart.forEach(item => {
    const rate = Number(item.mrp) || 0;
    const qty = Number(item.qty) || 1;
    const gstPercent = Number(item.gst_rate?.replace('%', '') || 0);

    const itemTotalInclusive = rate * qty;
    const itemTaxable = itemTotalInclusive / (1 + (gstPercent / 100));
    const itemTax = itemTotalInclusive - itemTaxable;

    totalTaxable += itemTaxable;
    totalTaxAmount += itemTax;
    grandTotal += itemTotalInclusive;
  });

  // 6. इनवॉइस जनरेट करना और सेव करना
  const handleGenerateInvoice = async () => {
    if (cart.length === 0) return alert("कार्ट खाली है! पहले आइटम जोड़ें।");
    if (!customer.mobile) return alert("कस्टमर का मोबाइल नंबर ज़रूरी है!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "invoices"), {
        customer,
        items: cart,
        gstType,
        totalTaxable: Number(totalTaxable.toFixed(2)),
        totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        timestamp: new Date()
      });
      alert("✅ Invoice Generated Successfully!");
      setCart([]); // बिल बनने के बाद कार्ट खाली
      setCustomer({ mobile: '', name: '', address: '' });
    } catch (error) {
      alert("Error generating invoice: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
      
      {/* LEFT SIDE: POS Billing */}
      <div>
        <h1 style={{ color: '#fff', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Receipt color="#eab308" size={32} /> Advanced POS Billing
        </h1>
        
        <div className="card" style={{ padding: '16px', minHeight: '500px' }}>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} size={20} />
            <input 
              type="text" 
              placeholder="Scan Barcode or Search Product..." 
              autoFocus 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '18px', padding: '12px 12px 12px 40px', margin: 0 }} 
            />
            
            {/* Search Dropdown */}
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '55px', left: 0, right: 0, background: '#222', border: '1px solid #444', borderRadius: '8px', zIndex: 10, maxHeight: '250px', overflowY: 'auto' }}>
                {searchResults.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => addToCart(item)}
                    style={{ padding: '12px 16px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', color: '#fff' }}
                  >
                    <div>
                      <strong>{item.name}</strong> <small style={{color:'#888'}}>({item.barcode})</small>
                    </div>
                    <div style={{ color: '#eab308' }}>₹ {item.mrp}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Cart Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', color: '#eab308' }}>Item</th>
                  <th style={{ padding: '12px', color: '#eab308' }}>Rate</th>
                  <th style={{ padding: '12px', color: '#eab308' }}>Qty</th>
                  <th style={{ padding: '12px', color: '#eab308' }}>GST %</th>
                  <th style={{ padding: '12px', color: '#eab308' }}>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 'bold' }}>
                      {item.name}<br/>
                      <small style={{color:'#888', fontWeight:'normal'}}>Stock: {item.stock}</small>
                    </td>
                    <td style={{ padding: '12px' }}>₹ {item.mrp}</td>
                    <td style={{ padding: '12px' }}>
                      <input 
                        type="number" 
                        value={item.qty} 
                        onChange={(e) => updateQty(item.id, e.target.value)}
                        style={{ width: '70px', margin: 0, padding: '8px', background: '#000' }} 
                      />
                    </td>
                    <td style={{ padding: '12px' }}>{item.gst_rate}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '16px' }}>₹ {(item.mrp * item.qty).toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <button onClick={() => removeFromCart(item.id)} className="btn-danger" style={{padding:'8px'}}><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr><td colSpan="6" style={{textAlign:'center', padding:'40px', color:'#888'}}>Cart is empty. Search items to add.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Invoice Details */}
      <div className="card" style={{ height: 'fit-content' }}>
        <h2 style={{ marginTop: 0, color: '#eab308', borderBottom: '1px solid #333', paddingBottom: '16px' }}>Invoice Details</h2>
        
        <div style={{ margin: '20px 0' }}>
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Customer Mobile *</label>
          <input type="text" placeholder="10-digit mobile" required value={customer.mobile} onChange={e => setCustomer({...customer, mobile: e.target.value})} />
          
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Customer Name</label>
          <input type="text" placeholder="Customer Name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
          
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Customer Address</label>
          <input type="text" placeholder="Billing Address" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase', display:'block', marginBottom:'8px'}}>GST Type</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="radio" checked={gstType === 'intra'} onChange={() => setGstType('intra')} style={{width:'auto', margin:0}} /> Local (CGST+SGST)
            </label>
            <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="radio" checked={gstType === 'inter'} onChange={() => setGstType('inter')} style={{width:'auto', margin:0}} /> Interstate (IGST)
            </label>
          </div>
        </div>

        {/* Totals Box */}
        <div style={{ background: '#000', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}>
            <span>Taxable Amount</span>
            <span>₹ {totalTaxable.toFixed(2)}</span>
          </div>
          
          {gstType === 'intra' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}>
                <span>CGST</span>
                <span>₹ {(totalTaxAmount / 2).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}>
                <span>SGST</span>
                <span>₹ {(totalTaxAmount / 2).toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}>
              <span>IGST</span>
              <span>₹ {totalTaxAmount.toFixed(2)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '12px', marginTop: '12px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color:'#fff' }}>Grand Total</span>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e' }}>₹ {grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        </div>

        <button onClick={handleGenerateInvoice} disabled={loading} className="btn-success" style={{ width: '100%', padding: '16px', fontSize: '18px', justifyContent: 'center' }}>
          <Printer size={20} /> {loading ? 'Saving...' : 'Generate GST Invoice'}
        </button>
      </div>
    </div>
  );
}
