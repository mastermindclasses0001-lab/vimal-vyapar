import { useState, useEffect } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { exportToExcel } from '../utils/excelExport';

export default function Reports() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const iSnap = await getDocs(query(collection(db, "invoices"), orderBy("timestamp", "desc")));
      const rMap = {};

      iSnap.forEach(doc => {
        const data = doc.data();
        const dateStr = data.date; 

        if(!rMap[dateStr]) {
          rMap[dateStr] = {
            date: dateStr,
            total_sales: 0,
            cgs: 0,
            gross_margin: 0,
            total_discount: 0,
            tax_collected: 0,
            net_profit: 0
          };
        }

        rMap[dateStr].total_sales += Number(data.grandTotal || 0);
        rMap[dateStr].total_discount += Number(data.totalDiscount || 0);
        rMap[dateStr].tax_collected += Number(data.totalTaxAmount || 0);
        
        let cogs = 0;
        data.items?.forEach(item => {
          cogs += (Number(item.purchase_price || 0) * Number(item.qty || 1));
        });
        rMap[dateStr].cgs += cogs;

        const profit = Number(data.totalTaxable || 0) - cogs;
        rMap[dateStr].net_profit += profit;
        rMap[dateStr].gross_margin += profit; 
      });

      setReportData(Object.values(rMap));
      setLoading(false);
    };
    fetchReports();
  }, []);

  const handleExport = () => {
    exportToExcel(reportData, `Profit_Loss_Report`);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 color="#38bdf8" size={32} /> P&L Reports
        </h1>
        <button onClick={handleExport} className="btn-success"><Download size={18} /> Download Excel</button>
      </div>

      <div className="table-container">
        {loading ? <div style={{padding:'20px', color:'#eab308'}}>Calculating P&L...</div> : (
          <table>
            <thead>
              <tr><th>Date</th><th>Gross Sales</th><th>COGS</th><th>Discount</th><th>Tax</th><th style={{ color: '#22c55e' }}>Net Profit</th></tr>
            </thead>
            <tbody>
              {reportData.map((row, i) => (
                <tr key={i}>
                  <td style={{ color: '#888' }}>{row.date}</td>
                  <td style={{ fontWeight: 'bold' }}>₹ {row.total_sales.toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                  <td style={{ color: '#ef4444' }}>₹ {row.cgs.toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                  <td style={{ color: '#38bdf8' }}>₹ {row.total_discount.toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                  <td style={{ color: '#eab308' }}>₹ {row.tax_collected.toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                  <td style={{ color: '#22c55e', fontSize: '18px', fontWeight: 'bold' }}>₹ {row.net_profit.toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                </tr>
              ))}
              {reportData.length === 0 && <tr><td colSpan="6" style={{textAlign: 'center', color: '#888'}}>No sales data available.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}