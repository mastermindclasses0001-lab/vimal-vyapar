import { useState, useEffect } from 'react';
import { Receipt, Printer, Search, Trash2, X } from 'lucide-react';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Billing() {
  const { currentUser } = useAuth();
  const [gstType, setGstType] = useState('intra'); 
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ mobile: '', name: '', address: '' });
  const [loading, setLoading] = useState(false);
  
  const [lastInvoice, setLastInvoice] = useState(null); 
  const [storeDetails, setStoreDetails] = useState({ storeName: 'VIMAL VYAPAR', tagline: 'A PRODUCT OF BHRIVIM LAB', address: 'Barganda, Giridih', gstin: '' });

  useEffect(() => {
    const fetchData = async () => {
      const pSnap = await getDocs(collection(db, "products"));
      const items = [];
      pSnap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setProducts(items);

      const sSnap = await getDoc(doc(db, 'settings', 'storeDetails'));
      if (sSnap.exists()) setStoreDetails(sSnap.data());
    };
    fetchData();
  }, []);

  const searchResults = searchTerm ? products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm)) : [];

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    else setCart([...cart, { ...product, qty: 1, discount: 0 }]);
    setSearchTerm('');
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const updateQty = (id, newQty) => setCart(cart.map(item => item.id === id ? { ...item, qty: Math.max(1, parseInt(newQty||1)) } : item));
  const updateDiscount = (id, newDiscount) => setCart(cart.map(item => item.id === id ? { ...item, discount: Number(newDiscount) } : item));

  let subTotal = 0, totalDiscount = 0, totalTaxable = 0, totalTaxAmount = 0, grandTotal = 0;

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
    if (cart.length === 0) return alert("कार्ट खाली है!");
    if (!customer.mobile) return alert("कस्टमर का मोबाइल नंबर ज़रूरी है!");
    
    setLoading(true);
    try {
      const invoiceData = {
        invoiceNo: "INV-" + Math.floor(100000 + Math.random() * 900000),
        customer, 
        items: cart, 
        gstType,
        sellerName: currentUser.name,
        sellerId: currentUser.uid,
        subTotal: Number(subTotal.toFixed(2)),
        totalDiscount: Number(totalDiscount.toFixed(2)),
        totalTaxable: Number(totalTaxable.toFixed(2)),
        totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        date: new Date().toLocaleDateString('en-IN'),
        timestamp: new Date()
      };

      await addDoc(collection(db, "invoices"), invoiceData);
      
      for (const item of cart) {
        const prodRef = doc(db, "products", item.id);
        const newStock = Math.max(0, item.stock - item.qty);
        await updateDoc(prodRef, { stock: newStock });
      }

      setLastInvoice(invoiceData);
      setCart([]);
      setCustomer({ mobile: '', name: '', address: '' });
      
      const pSnap = await getDocs(collection(db, "products"));
      const items = [];
      pSnap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setProducts(items);

    } catch (error) {
      alert("Error generating invoice: " + error.message);
    }
    setLoading(false);
  };

  // Safe wrapper for printing
  const executePrint = () => {
    window.print();
  };

  return (
    <>
      {/* POS Billing Form - Hidden during Print */}
      <div className="no-print" style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div>
          <h1 style={{ color: '#fff', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Receipt color="#eab308" size={32} /> Point of Sale
          </h1>
          <div className="card" style={{ padding: '16px', minHeight: '500px' }}>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} size={20} />
              <input type="text" placeholder="Search Product..." autoFocus value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ fontSize: '18px', padding: '12px 12px 12px 40px', margin: 0 }} />
              {searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '55px', left: 0, right: 0, background: '#222', zIndex: 10, maxHeight: '250px', overflowY: 'auto' }}>
                  {searchResults.map(item => (
                    <div key={item.id} onClick={() => addToCart(item)} style={{ padding: '12px 16px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                      <div><strong>{item.name}</strong> <small style={{color:'#888'}}>({item.stock} left)</small></div><div style={{ color: '#eab308' }}>₹ {item.mrp}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th style={{ padding: '12px', color: '#eab308' }}>Item</th><th style={{ padding: '12px', color: '#eab308' }}>Rate</th><th style={{ padding: '12px', color: '#eab308' }}>Qty</th><th style={{ padding: '12px', color: '#38bdf8' }}>Disc(₹)</th><th style={{ padding: '12px', color: '#eab308' }}>Total</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 'bold' }}>{item.name}<br/><small style={{color:'#888', fontWeight:'normal'}}>Stk: {item.stock}</small></td>
                      <td style={{ padding: '12px' }}>₹{item.mrp}</td>
                      <td style={{ padding: '12px' }}><input type="number" value={item.qty} onChange={(e) => updateQty(item.id, e.target.value)} style={{ width: '60px', margin: 0, padding: '8px' }} /></td>
                      <td style={{ padding: '12px' }}><input type="number" value={item.discount || ''} onChange={(e) => updateDiscount(item.id, e.target.value)} style={{ width: '80px', margin: 0, padding: '8px' }} /></td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>₹{Math.max(0, (item.mrp * item.qty) - (item.discount || 0)).toLocaleString()}</td>
                      <td style={{ padding: '12px' }}><button onClick={() => removeFromCart(item.id)} className="btn-danger" style={{padding:'8px'}}><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ marginTop: 0, color: '#eab308', borderBottom: '1px solid #333', paddingBottom: '16px' }}>Invoice Details</h2>
          <div style={{ margin: '20px 0' }}>
            <input type="text" placeholder="Customer Mobile *" required value={customer.mobile} onChange={e => setCustomer({...customer, mobile: e.target.value})} />
            <input type="text" placeholder="Customer Name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
            <input type="text" placeholder="Customer Address" required value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <label style={{ color: '#fff' }}><input type="radio" checked={gstType === 'intra'} onChange={() => setGstType('intra')} /> Local (CGST+SGST)</label>
            <label style={{ color: '#fff' }}><input type="radio" checked={gstType === 'inter'} onChange={() => setGstType('inter')} /> Interstate (IGST)</label>
          </div>
          <div style={{ background: '#000', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}><span>Taxable Amount</span><span>₹ {totalTaxable.toFixed(2)}</span></div>
            {gstType === 'intra' ? (
              <><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}><span>CGST/SGST</span><span>₹ {(totalTaxAmount).toFixed(2)}</span></div></>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}><span>IGST</span><span>₹ {totalTaxAmount.toFixed(2)}</span></div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '12px', marginTop: '12px' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color:'#fff' }}>Total</span>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e' }}>₹ {grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <button onClick={handleGenerateInvoice} disabled={loading} className="btn-success" style={{ width: '100%', padding: '16px', fontSize: '18px', justifyContent: 'center' }}>
            <Printer size={20} /> Generate Invoice
          </button>
        </div>
      </div>

      {/* Invoice Print Section (ONLY Visible during Print or when generated) */}
      {lastInvoice && (
        <div className="print-section" style={{ zIndex: 1000 }}>
          
          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px', padding: '20px', background: '#111' }}>
            <button onClick={executePrint} className="btn-success"><Printer size={16} /> Print Document</button>
            <button onClick={() => setLastInvoice(null)} className="btn-danger"><X size={16} /> Close Preview</button>
          </div>

          <div id="printable-invoice" style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', color: '#000', padding: '40px', border: '1px solid #ddd' }}>
            <div style={{ borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ margin: '0 0 5px 0', fontSize: '32px', textTransform: 'uppercase', color: '#000' }}>{storeDetails.storeName}</h1>
                {storeDetails.tagline && <p style={{ margin: 0, color: '#000' }}>{storeDetails.tagline}</p>}
                <p style={{ margin: 0, color: '#000' }}>{storeDetails.address}</p>
                {storeDetails.gstin && <p style={{ margin: 0, fontWeight: 'bold', color: '#000' }}>GSTIN: {storeDetails.gstin}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, color: '#000' }}>TAX INVOICE</h2>
                <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', color: '#000' }}>Inv #: {lastInvoice.invoiceNo}</p>
                <p style={{ margin: 0, color: '#000' }}>Date: {lastInvoice.date}</p>
              </div>
            </div>

            <div style={{ marginBottom: '20px', color: '#000' }}>
              <strong style={{color: '#000'}}>Billed To:</strong><br/>
              <span style={{color: '#000'}}>{lastInvoice.customer.name || 'Cash Customer'}</span><br/>
              <span style={{color: '#000'}}>Phone: +91 {lastInvoice.customer.mobile}</span><br/>
              {lastInvoice.customer.address && <span style={{color: '#000'}}>Address: {lastInvoice.customer.address}</span>}
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '10px', color: '#000' }}>Item Description</th>
                  <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', color: '#000' }}>Rate</th>
                  <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', color: '#000' }}>Qty</th>
                  <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', color: '#000' }}>Disc.</th>
                  <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', color: '#000' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lastInvoice.items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #000', padding: '10px', color: '#000' }}>{item.name}</td>
                    <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', color: '#000' }}>₹ {item.mrp}</td>
                    <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', color: '#000' }}>{item.qty}</td>
                    <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', color: '#000' }}>₹ {item.discount || 0}</td>
                    <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#000' }}>₹ {Math.max(0, (item.mrp * item.qty) - (item.discount || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ textAlign: 'right', fontSize: '20px', fontWeight: 'bold', color: '#000' }}>
              Grand Total: ₹ {lastInvoice.grandTotal}
            </div>
            <div style={{ marginTop: '50px', textAlign: 'right', paddingRight: '20px', color: '#000' }}>
              <p style={{ margin: '0 0 40px 0', color: '#000' }}>For {storeDetails.storeName}</p>
              <p style={{ margin: 0, borderTop: '1px solid #000', display: 'inline-block', paddingTop: '5px', color: '#000' }}>Authorized Signatory</p>
            </div>
            <div style={{ marginTop: '20px', fontSize: '10px', color: '#555' }}>
              Served By: {lastInvoice.sellerName}
            </div>
          </div>
        </div>
      )}
    </>
  );
}