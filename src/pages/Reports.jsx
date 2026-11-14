import { useState, useEffect } from 'react';
import { BarChart3, Download, Package, Users, Tag } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { exportToExcel } from '../utils/excelExport';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('sales'); 
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Sales Report
  const [salesFilter, setSalesFilter] = useState('daily');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    const fetchAllData = async () => {
      const iSnap = await getDocs(collection(db, "invoices"));
      const pSnap = await getDocs(collection(db, "products"));
      
      const invs = [];
      iSnap.forEach(doc => invs.push(doc.data()));
      setInvoices(invs.sort((a,b) => b.timestamp - a.timestamp));

      const prods = [];
      pSnap.forEach(doc => prods.push({id: doc.id, ...doc.data()}));
      setProducts(prods);
      
      setLoading(false);
    };
    fetchAllData();
  }, []);

  // 1. SALES REPORT LOGIC
  const getSalesReport = () => {
    const rMap = {};
    invoices.forEach(data => {
      let key = data.date;
      
      if (salesFilter === 'monthly') {
        const parts = data.date.split('/');
        key = `${parts[1]}/${parts[2]}`; // MM/YYYY
      } else if (salesFilter === 'custom') {
        // Simple fallback if no custom date selected
        if(!customStart || !customEnd) key = 'Custom Range';
        else {
          const invDate = new Date(data.timestamp.toDate());
          const sDate = new Date(customStart);
          const eDate = new Date(customEnd);
          if(invDate >= sDate && invDate <= eDate) key = `${customStart} to ${customEnd}`;
          else return; // skip
        }
      }

      if(!rMap[key]) {
        rMap[key] = { Date: key, Gross_Sales: 0, COGS: 0, Discount: 0, Net_Profit: 0 };
      }
      rMap[key].Gross_Sales += Number(data.grandTotal || 0);
      rMap[key].Discount += Number(data.totalDiscount || 0);
      
      let cogs = 0;
      data.items?.forEach(item => { cogs += (Number(item.purchase_price || 0) * Number(item.qty || 1)); });
      rMap[key].COGS += cogs;
      rMap[key].Net_Profit += (Number(data.totalTaxable || 0) - cogs);
    });
    return Object.values(rMap);
  };

  // 2. INVENTORY REPORT LOGIC
  const getInventoryReport = () => {
    // Calculate total sold qty per product from invoices
    const soldMap = {};
    invoices.forEach(inv => {
      inv.items?.forEach(item => {
        if(!soldMap[item.barcode]) soldMap[item.barcode] = 0;
        soldMap[item.barcode] += Number(item.qty);
      });
    });

    return products.map(p => ({
      Barcode: p.barcode,
      Product_Name: p.name,
      Category: p.category,
      Total_Sold_Qty: soldMap[p.barcode] || 0,
      Remaining_Stock: p.stock,
      Purchase_Rate: p.purchase_price,
      MRP: p.mrp,
      Stock_Value: p.stock * p.purchase_price
    }));
  };

  // 3. PRODUCT WISE (Bestsellers)
  const getProductWiseReport = () => {
    const pMap = {};
    invoices.forEach(inv => {
      inv.items?.forEach(item => {
        if(!pMap[item.barcode]) {
          pMap[item.barcode] = { Barcode: item.barcode, Product_Name: item.name, Total_Qty_Sold: 0, Total_Revenue: 0, Buyers: new Set() };
        }
        pMap[item.barcode].Total_Qty_Sold += Number(item.qty);
        pMap[item.barcode].Total_Revenue += (Number(item.mrp) * Number(item.qty)) - (Number(item.discount) || 0);
        if(inv.customer?.name) pMap[item.barcode].Buyers.add(inv.customer.name);
      });
    });
    
    return Object.values(pMap).map(p => ({
      ...p,
      Buyers: Array.from(p.Buyers).join(', ') // Convert Set to String
    })).sort((a,b) => b.Total_Qty_Sold - a.Total_Qty_Sold); // Sort Bestsellers first
  };

  // 4. CUSTOMER WISE REPORT
  const getCustomerWiseReport = () => {
    const cMap = {};
    invoices.forEach(inv => {
      const mob = inv.customer?.mobile || 'Walk-in';
      if(!cMap[mob]) {
        cMap[mob] = { Mobile: mob, Customer_Name: inv.customer?.name || 'Walk-in', Total_Purchases: 0, Total_Profit_From_Them: 0, Last_Visit: inv.date, Items_Bought: new Set() };
      }
      
      cMap[mob].Total_Purchases += Number(inv.grandTotal || 0);
      
      let cogs = 0;
      inv.items?.forEach(item => { 
        cogs += (Number(item.purchase_price || 0) * Number(item.qty || 1)); 
        cMap[mob].Items_Bought.add(item.name);
      });
      cMap[mob].Total_Profit_From_Them += (Number(inv.totalTaxable || 0) - cogs);
      cMap[mob].Last_Visit = inv.date; 
    });

    return Object.values(cMap).map(c => ({
      ...c,
      Items_Bought: Array.from(c.Items_Bought).join(', ')
    })).sort((a,b) => b.Total_Purchases - a.Total_Purchases);
  };

  // Render Logic
  let tableData = [];
  if(activeTab === 'sales') tableData = getSalesReport();
  if(activeTab === 'inventory') tableData = getInventoryReport();
  if(activeTab === 'products') tableData = getProductWiseReport();
  if(activeTab === 'customers') tableData = getCustomerWiseReport();

  const handleExport = () => {
    exportToExcel(tableData, `Master_Report_${activeTab}`);
  };

  if (currentUser?.role !== 'admin') return null;

  return (
    <div className="no-print" style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 color="#38bdf8" size={32} /> Master Reporting Center
        </h1>
        <button onClick={handleExport} className="btn-success"><Download size={18} /> Export Current Data</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #333', marginBottom: '20px' }}>
        <button className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}><BarChart3 size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'5px'}}/> Sales & Profit</button>
        <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}><Package size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'5px'}}/> Inventory Status</button>
        <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}><Tag size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'5px'}}/> Product Performance</button>
        <button className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}><Users size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'5px'}}/> Customer Analytics</button>
      </div>

      {/* Filters for Sales Tab Only */}
      {activeTab === 'sales' && (
        <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '16px' }}>
          <Calendar color="#888" />
          <select style={{ width: '200px', margin: 0 }} value={salesFilter} onChange={(e) => setSalesFilter(e.target.value)}>
            <option value="daily">All-Time Daily Report</option>
            <option value="monthly">Monthly Report</option>
            <option value="custom">Custom Date Range</option>
          </select>
          {salesFilter === 'custom' && (
             <div style={{ display: 'flex', gap: '10px' }}>
               <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{ margin: 0, width:'150px' }} />
               <span style={{color:'#888', alignSelf:'center'}}>to</span>
               <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{ margin: 0, width:'150px' }} />
             </div>
          )}
        </div>
      )}

      {/* Dynamic Table Rendering */}
      <div className="table-container">
        {loading ? <div style={{padding:'20px', color:'#eab308'}}>Calculating Data...</div> : (
          <table>
            <thead>
              <tr style={{background: '#222'}}>
                {tableData.length > 0 && Object.keys(tableData[0]).map((key) => (
                  <th key={key} style={{padding: '12px'}}>{key.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={i} style={{borderBottom: '1px solid #222'}}>
                  {Object.values(row).map((val, idx) => (
                    <td key={idx} style={{ 
                      padding: '12px', 
                      color: (typeof val === 'number' && Object.keys(row)[idx].includes('Profit')) ? '#22c55e' : 
                             (typeof val === 'number' && Object.keys(row)[idx].includes('COGS')) ? '#ef4444' : '#fff',
                      fontWeight: typeof val === 'number' ? 'bold' : 'normal'
                    }}>
                      {typeof val === 'number' ? (Object.keys(row)[idx].includes('Qty') || Object.keys(row)[idx].includes('Stock') ? val : `₹ ${val.toLocaleString('en-IN', {maximumFractionDigits:2})}`) : val}
                    </td>
                  ))}
                </tr>
              ))}
              {tableData.length === 0 && <tr><td colSpan="10" style={{textAlign: 'center', color: '#888'}}>No data available for this report.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}