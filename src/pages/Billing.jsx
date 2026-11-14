import { useState } from 'react';
import { Receipt, Printer, Search, Plus, Trash2 } from 'lucide-react';

export default function Billing() {
  const [gstType, setGstType] = useState('intra'); // intra = CGST+SGST, inter = IGST

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
      
      <div>
        <h1 style={{ color: '#fff', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Receipt color="#eab308" size={32} /> Advanced POS Billing
        </h1>
        
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} size={20} />
              <input type="text" placeholder="Scan Barcode or Search Product..." autoFocus style={{ fontSize: '18px', padding: '12px 12px 12px 40px', margin: 0 }} />
            </div>
            <button className="btn-primary" style={{ padding: '0 20px' }}>Add</button>
          </div>
          
          <table style={{ marginTop: '20px' }}>
            <thead>
              <tr>
                <th>Item</th>
                <th>HSN</th>
                <th>Rate</th>
                <th>Qty</th>
                <th>GST %</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>Logitech Mouse<br/><small style={{color:'#888', fontWeight:'normal'}}>Stock: 45</small></td>
                <td>8471</td>
                <td>₹ 850.00</td>
                <td>
                  <input type="number" defaultValue="2" style={{ width: '70px', margin: 0, padding: '8px' }} />
                </td>
                <td>18%</td>
                <td style={{ fontWeight: 'bold', fontSize: '16px' }}>₹ 1700.00</td>
                <td><button className="btn-danger" style={{padding:'8px'}}><Trash2 size={16}/></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ height: 'fit-content' }}>
        <h2 style={{ marginTop: 0, color: '#eab308', borderBottom: '1px solid #333', paddingBottom: '16px' }}>Invoice Details</h2>
        
        <div style={{ margin: '20px 0' }}>
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Customer Mobile</label>
          <input type="text" placeholder="Enter Mobile to fetch details" />
          
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Customer Name</label>
          <input type="text" placeholder="Customer Name" />
          
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase'}}>Customer Address</label>
          <input type="text" placeholder="Billing Address" />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{color:'#888', fontSize:'12px', textTransform:'uppercase', display:'block', marginBottom:'8px'}}>GST Type</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="radio" name="gst" checked={gstType === 'intra'} onChange={() => setGstType('intra')} style={{width:'auto'}} /> Local (CGST + SGST)
            </label>
            <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="radio" name="gst" checked={gstType === 'inter'} onChange={() => setGstType('inter')} style={{width:'auto'}} /> Interstate (IGST)
            </label>
          </div>
        </div>

        <div style={{ background: '#000', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}>
            <span>Taxable Amount</span>
            <span>₹ 1,440.68</span>
          </div>
          
          {gstType === 'intra' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}>
                <span>CGST (9%)</span>
                <span>₹ 129.66</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}>
                <span>SGST (9%)</span>
                <span>₹ 129.66</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888' }}>
              <span>IGST (18%)</span>
              <span>₹ 259.32</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '12px', marginTop: '12px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color:'#fff' }}>Grand Total</span>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e' }}>₹ 1,700.00</span>
          </div>
        </div>

        <button className="btn-success" style={{ width: '100%', padding: '16px', fontSize: '18px', justifyContent: 'center' }}>
          <Printer size={20} /> Generate GST Invoice
        </button>
      </div>
    </div>
  );
}