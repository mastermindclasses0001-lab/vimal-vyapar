import { useState, useEffect } from 'react';
import { BarChart3, Download, Package, Users, Tag, Calendar } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { exportToExcel } from '../utils/excelExport';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('sales'); 
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [salesFilter, setSalesFilter] = useState('daily');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const iSnap = await getDocs(query(collection(db, "invoices"), orderBy("timestamp", "desc")));
        const invs = [];
        iSnap.forEach(doc => invs.push(doc.data()));
        setInvoices(invs);

        const pSnap = await getDocs(collection(db, "products"));
        const prods = [];
        pSnap.forEach(doc => prods.push({id: doc.id, ...doc.data()}));
        setProducts(prods);
      } catch (error) {
        console.error("Error:", error);
      }
      setLoading(false);
    };
    fetchAllData();
  }, []);

  const getSalesReport = () => {
    const rMap = {};
    invoices.forEach(data => {
      let key = data.date || 'Unknown Date';
      
      if (salesFilter === 'monthly') {
        const parts = key.split('/');
        if(parts.length === 3) key = `${parts[1]}/${parts[2]}`; 
      } else if (salesFilter === 'custom') {
        if(!customStart || !customEnd) {
            key = 'Custom Range';
        } else {
            if(data.timestamp) {
                const invDate = new Date(data.timestamp.toDate());
                const sDate = new Date(customStart);
                const eDate = new Date(customEnd);
                eDate.setHours(23, 59, 59);
                if(invDate >= sDate && invDate <= eDate) {
                    key = `${customStart} to ${customEnd}`;
                } else return; 
            } else return;
        }
      }

      if(!rMap[key]) rMap[key] = { Date: key, Gross_Sales: 0, COGS: 0, Discount: 0, Net_Profit: 0 };
      rMap[key].Gross_Sales += Number(data.grandTotal || 0);
      rMap[key].Discount += Number(data.totalDiscount || 0);
      let cogs = 0;
      data.items?.forEach(item => { cogs += (Number(item.purchase_price || 0) * Number(item.qty || 1)); });
      rMap[key].COGS += cogs;
      rMap[key].Net_Profit += (Number(data.totalTaxable || 0) - cogs);
    });
    return Object.values(rMap);
  };

  const getInventoryReport = () => {
    const soldMap = {};
    invoices.forEach(inv => {
      inv.items?.forEach(item => {
        if(item.barcode) {
            if(!soldMap[item.barcode]) soldMap[item.barcode] = 0;
            soldMap[item.barcode] += Number(item.qty || 0);
        }
      });
    });

    return products.map(p => ({
      Barcode: p.barcode || 'N/A',
      Product_Name: p.name || 'N/A',
      Category: p.category || 'N/A',
      Total_Sold_Qty: soldMap[p.barcode] || 0,
      Remaining_Stock: p.stock || 0,
      Purchase_Rate: p.purchase_price || 0,
      MRP: p.mrp || 0,
      Stock_Value: (p.stock || 0) * (p.purchase_price || 0)
    }));
  };

  const getProductWiseReport = () => {
    const pMap = {};
    invoices.forEach(inv => {
      inv.items?.forEach(item => {
        const bc = item.barcode || 'Unknown';
        if(!pMap[bc]) pMap[bc] = { Barcode: bc, Product_Name: item.name || 'N/A', Total_Qty_Sold: 0, Total_Revenue: 0, Buyers: new Set() };
        pMap[bc].Total_Qty_Sold += Number(item.qty || 0);
        pMap[bc].Total_Revenue += (Number(item.mrp || 0) * Number(item.qty || 0)) - (Number(item.discount || 0));
        if(inv.customer?.name) pMap[bc].Buyers.add(inv.customer.name);
      });
    });
    return Object.values(pMap).map(p => ({
      ...p, Buyers: Array.from(p.Buyers).join(', ') 
    })).sort((a,b) => b.Total_Qty_Sold - a.Total_Qty_Sold); 
  };

  const getCustomerWiseReport = () => {
    const cMap = {};
    invoices.forEach(inv => {
      const mob = inv.customer?.mobile || 'Walk-in';
      if(!cMap[mob]) cMap[mob] = { Mobile: mob, Customer_Name: inv.customer?.name || 'Walk-in', Total_Purchases: 0, Total_Profit_From_Them: 0, Last_Visit: inv.date || '', Items_Bought: new Set() };
      
      cMap[mob].Total_Purchases += Number(inv.grandTotal || 0);
      let cogs = 0;
      inv.items?.forEach(item => { 
        cogs += (Number(item.purchase_price || 0) * Number(item.qty || 1)); 
        if(item.name) cMap[mob].Items_Bought.add(item.name);
      });
      cMap[mob].Total_Profit_From_Them += (Number(inv.totalTaxable || 0) - cogs);
      
      if(!cMap[mob].Last_Visit_Date || (inv.timestamp && new Date(inv.timestamp.toDate()) > cMap[mob].Last_Visit_Date)) {
         cMap[mob].Last_Visit = inv.date;
         if(inv.timestamp) cMap[mob].Last_Visit_Date = new Date(inv.timestamp.toDate());
      }
    });

    return Object.values(cMap).map(c => {
      const { Last_Visit_Date, ...rest } = c;
      return { ...rest, Items_Bought: Array.from(rest.Items_Bought).join(', ') };
    }).sort((a,b) => b.Total_Purchases - a.Total_Purchases);
  };

  let tableData = [];
  if(activeTab === 'sales') tableData = getSalesReport();
  if(activeTab === 'inventory') tableData = getInventoryReport();
  if(activeTab === 'products') tableData = getProductWiseReport();
  if(activeTab === 'customers') tableData = getCustomerWiseReport();

  const handleExport = () => exportToExcel(tableData, `Master_Report_${activeTab}`);

  if (currentUser?.role !== 'admin') return null;

  return (
    <div className="no-print main-container">
      <div className="header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 color="#38bdf8" size={32} />
          <h1 style={{ color: '#fff', margin: 0 }}>Master Reporting Center</h1>
        </div>
        <div className="header-actions">
           <button onClick={handleExport} className="btn btn-success"><Download size={18} /> Export Data</button>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}><BarChart3 size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'5px'}}/> Sales & Profit</button>
        <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}><Package size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'5px'}}/> Inventory Status</button>
        <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}><Tag size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'5px'}}/> Product Performance</button>
        <button className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}><Users size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'5px'}}/> Customer Analytics</button>
      </div>

      {activeTab === 'sales' && (
        <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '16px', flexWrap: 'wrap' }}>
          <Calendar color="#888" />
          <select style={{ width: '200px', margin: 0 }} value={salesFilter} onChange={(e) => setSalesFilter(e.target.value)}>
            <option value="daily">All-Time Daily Report</option>
            <option value="monthly">Monthly Report</option>
            <option value="custom">Custom Date Range</option>
          </select>
          {salesFilter === 'custom' && (
             <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
               <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{ margin: 0, width:'150px' }} />
               <span style={{color:'#888'}}>to</span>
               <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{ margin: 0, width:'150px' }} />
             </div>
          )}
        </div>
      )}

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