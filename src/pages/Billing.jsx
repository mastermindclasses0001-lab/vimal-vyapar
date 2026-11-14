import { useState, useEffect } from 'react';
import { Receipt, Printer, Search, Trash2, X, Download } from 'lucide-react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Billing() {
  const [gstType, setGstType] = useState('intra'); 
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ mobile: '', name: '', address: '' });
  const [discount, setDiscount] = useState(''); 
  const [loading, setLoading] = useState(false);
  
  // नया स्टेट: प्रिंट करने के लिए तैयार इनवॉइस
  const [lastInvoice, setLastInvoice] = useState(null); 

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      const items = [];
      querySnapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setProducts(items);
    };
    fetchProducts();
  }, []);

  const searchResults = searchTerm 
    ? products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm))
    : [];

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1, discount: 0 }]);
    }
    setSearchTerm('');
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const updateQty = (id, newQty) => {
    if (newQty < 1) return;
    setCart(cart.map(item => item.id === id ? { ...item, qty: parseInt(newQty) } : item));
  };
  const updateDiscount = (id, newDiscount) => {
    setCart(cart.map(item => item.id === id ? { ...item, discount: Number(newDiscount) } : item));
  };

  let subTotal = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalTaxAmount = 0;
  let grandTotal = 0;

  cart.forEach(item => {
    const rate = Number(item.mrp) || 0;
    const qty = Number(item.qty) || 1;
    const itemDiscount = Number(item.discount) || 0;
    const gstPercent = Number(item.gst_rate?.replace('%', '') || 0);

    const itemGross = rate * qty;
    const itemNet = Math.max(0, itemGross - itemDiscount);

    const itemTaxable = itemNet / (1 + (gstPercent / 100));
    const itemTax = itemNet - itemTaxable;

    subTotal += itemGross;
    totalDiscount += itemDiscount;
    totalTaxable += itemTaxable;
    totalTaxAmount += itemTax;
    grandTotal += itemNet;
  });

  const handleGenerateInvoice = async () => {
    if (cart.length === 0) return alert("कार्ट खाली है! पहले आइटम जोड़ें।");
    if (!customer.mobile) return alert("कस्टमर का मोबाइल नंबर ज़रूरी है!");
    
    setLoading(true);
    try {
      const invoiceData = {
        invoiceNo: "INV-" + Math.floor(100000 + Math.random() * 900000), // Random Invoice Number
        customer,
        items: cart,
        gstType,
        subTotal: Number(subTotal.toFixed(2)),
        totalDiscount: Number(totalDiscount.toFixed(2)),
        totalTaxable: Number(totalTaxable.toFixed(2)),
        totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        date: new Date().toLocaleDateString('en-IN'),
        timestamp: new Date()
      };

      await addDoc(collection(db, "invoices"), invoiceData);
      
      // बिल जनरेट होने के बाद प्रिंट के लिए सेट करें
      setLastInvoice(invoiceData);
      
      // नया बिल बनाने के लिए फॉर्म खाली करें
      setCart([]);
      setCustomer({ mobile: '', name: '', address: '' });
    } catch (error) {
      alert("Error generating invoice: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
      
      {/* Print CSS Injection */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-invoice, #printable-invoice * { visibility: visible; }
            #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
            .no-print { display: none !important; }
          }
        `}
      </style>

      {/* POS Billing Screen */}
      <div>
        <h1 style={{ color: '#fff', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Receipt color="#eab308" size={32} /> Advanced POS Billing
        </h1>
        
        <div className="card" style={{ padding: '16px', minHeight: '500px' }}>
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
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '55px', left: 0, right: 0, background: '#222', border: '1px solid #444', borderRadius: '8px', zIndex: 10, maxHeight: '250px', overflowY: 'auto' }}>
                {searchResults.map(item => (
                  <div key={item.id} onClick={() => addToCart(item)} style={{ padding: '12px 16px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                    <div><strong>{item.name}</strong> <small style={{color:'#888'}}>({item.barcode})</small></div>
                    <div style={{ color: '#eab308' }}>₹ {item.mrp}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', color: '#eab308' }}>Item</th>
                  <th style={{ padding: '12px', color: '#eab308' }}>Rate</th>
                  <th style={{ padding: '12px', color: '#eab308' }}>Qty</th>
                  <th style={{ padding: '12px', color: '#38bdf8' }}>Disc (₹)</th>
                  <th style={{ padding: '12px', color: '#eab308' }}>GST%</th>
                  <th style={{ padding: '12px', color: '#eab308' }}>Net Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => {
                  const netTotal = Math.max(0, (item.mrp * item.qty) - (item.discount || 0));
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 'bold' }}>{item.name}<br/><small style={{color:'#888', fontWeight:'normal'}}>Stock: {item.stock}</small></td>
                      <td style={{ padding: '12px' }}>₹ {item.mrp}</td>
                      <td style={{ padding: '12px' }}><input type="number" value={item.qty} onChange={(e) => updateQty(item.id, e.target.value)} style={{ width: '60px', margin: 0, padding: '8px', background: '#000' }} /></td>
                      <td style={{ padding: '12px' }}><input type="number" placeholder="0" value={item.discount || ''} onChange={(e) => updateDiscount(item.id, e.target.value)} style={{ width: '80px', margin: 0, padding: '8px', background: '#222', color: '#38bdf8', fontWeight: 'bold' }} /></td>
                      <td style={{ padding: '12px' }}>{item.gst_rate}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '16px' }}>₹ {netTotal.toLocaleString()}</td>
                      <td style={{ padding: '12px' }}><button onClick={() => removeFromCart(item.id)} className="btn-danger" style={{padding:'8px'}}><Trash2 size={16}/></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Details Screen */}
      <div className="card" style={{ height: 'fit-content' }}>
        <h2 style={{ marginTop: 0, color: '#eab308', borderBottom: '1px solid #333', paddingBottom: '16px' }}>Invoice Details</h2>
        <div style={{ margin: '20px 0' }}>
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Customer Mobile *</label>
          <input type="text" placeholder="10-digit mobile" required value={customer.mobile} onChange={e => setCustomer({...customer, mobile: e.target.value})} />
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Customer Name</label>
          <input type="text" placeholder="Customer Name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase', display:'block', marginBottom:'8px'}}>GST Type</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}><input type="radio" checked={gstType === 'intra'} onChange={() => setGstType('intra')} style={{width:'auto', margin:0}} /> Local (CGST+SGST)</label>
            <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}><input type="radio" checked={gstType === 'inter'} onChange={() => setGstType('inter')} style={{width:'auto', margin:0}} /> Interstate (IGST)</label>
          </div>
        </div>
        <div style={{ background: '#000', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}><span>Total Value</span><span>₹ {subTotal.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #333' }}><span style={{ color: '#38bdf8' }}>Total Discount</span><span style={{ color: '#38bdf8' }}>- ₹ {totalDiscount.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}><span>Taxable Amount</span><span>₹ {totalTaxable.toFixed(2)}</span></div>
          {gstType === 'intra' ? (
            <><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}><span>CGST</span><span>₹ {(totalTaxAmount / 2).toFixed(2)}</span></div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}><span>SGST</span><span>₹ {(totalTaxAmount / 2).toFixed(2)}</span></div></>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}><span>IGST</span><span>₹ {totalTaxAmount.toFixed(2)}</span></div>
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

      {/* Invoice Print Modal (Popup) */}
      {lastInvoice && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px' }}>
          
          {/* Printable Area - White Background */}
          <div id="printable-invoice" style={{ background: '#fff', color: '#000', width: '800px', padding: '40px', borderRadius: '8px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', position: 'relative' }}>
            
            {/* Modal Controls (Hidden during print) */}
            <div className="no-print" style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
              <button onClick={() => window.print()} className="btn-success"><Printer size={16} /> Print</button>
              <button onClick={() => setLastInvoice(null)} className="btn-danger"><X size={16} /> Close</button>
            </div>

            {/* Invoice Header */}
            <div style={{ borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ margin: '0 0 5px 0', fontSize: '32px', color: '#000' }}>VIMAL VYAPAR</h1>
                <p style={{ margin: 0, color: '#555' }}>A PRODUCT OF BHRIVIMLAB</p>
                <p style={{ margin: 0, color: '#555' }}>Barganda, Giridih, Jharkhand - 815301</p>
                <p style={{ margin: 0, color: '#555' }}>GSTIN: 20XXXXX1234X1Z5</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, color: '#000' }}>TAX INVOICE</h2>
                <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>Invoice #: {lastInvoice.invoiceNo}</p>
                <p style={{ margin: 0 }}>Date: {lastInvoice.date}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Billed To:</h3>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{lastInvoice.customer.name || 'Cash Customer'}</p>
              <p style={{ margin: 0 }}>Phone: +91 {lastInvoice.customer.mobile}</p>
              {lastInvoice.customer.address && <p style={{ margin: 0 }}>Address: {lastInvoice.customer.address}</p>}
            </div>

            {/* Itemized Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '10px', color: '#000' }}>S.No</th>
                  <th style={{ border: '1px solid #000', padding: '10px', color: '#000' }}>Item Description</th>
                  <th style={{ border: '1px solid #000', padding: '10px', color: '#000' }}>HSN</th>
                  <th style={{ border: '1px solid #000', padding: '10px', color: '#000' }}>Rate</th>
                  <th style={{ border: '1px solid #000', padding: '10px', color: '#000' }}>Qty</th>
                  <th style={{ border: '1px solid #000', padding: '10px', color: '#000' }}>Disc.</th>
                  <th style={{ border: '1px solid #000', padding: '10px', color: '#000' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lastInvoice.items.map((item, index) => {
                  const netTotal = Math.max(0, (item.mrp * item.qty) - (item.discount || 0));
                  return (
                    <tr key={index}>
                      <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>{index + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>{item.name}</td>
                      <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>{item.barcode}</td>
                      <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>₹ {item.mrp}</td>
                      <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>₹ {item.discount || 0}</td>
                      <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>₹ {netTotal.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Totals Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: '40%' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>* Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
              </div>
              <div style={{ width: '50%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', border: '1px solid #000' }}>Total Taxable Value</td>
                      <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold' }}>₹ {lastInvoice.totalTaxable}</td>
                    </tr>
                    {lastInvoice.gstType === 'intra' ? (
                      <>
                        <tr>
                          <td style={{ padding: '8px', border: '1px solid #000' }}>CGST</td>
                          <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'right' }}>₹ {(lastInvoice.totalTaxAmount / 2).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px', border: '1px solid #000' }}>SGST</td>
                          <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'right' }}>₹ {(lastInvoice.totalTaxAmount / 2).toFixed(2)}</td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #000' }}>IGST</td>
                        <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'right' }}>₹ {lastInvoice.totalTaxAmount}</td>
                      </tr>
                    )}
                    <tr style={{ background: '#f0f0f0' }}>
                      <td style={{ padding: '12px 8px', border: '1px solid #000', fontWeight: 'bold', fontSize: '18px' }}>Grand Total</td>
                      <td style={{ padding: '12px 8px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>₹ {lastInvoice.grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div style={{ marginTop: '50px', textAlign: 'right', paddingRight: '20px' }}>
              <p style={{ margin: '0 0 40px 0' }}>For VIMAL VYAPAR</p>
              <p style={{ margin: 0, borderTop: '1px solid #000', display: 'inline-block', paddingTop: '5px' }}>Authorized Signatory</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
