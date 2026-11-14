import { useState } from 'react';
import { BarChart3, Download, Calendar } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function Reports() {
  const [reportType, setReportType] = useState('daily');

  // Dummy Report Data
  const reportData = [
    { date: '2026-11-14', total_sales: 17750, cgs: 14000, gross_profit: 3750, cgst: 800, sgst: 800, net_profit: 2150 },
    { date: '2026-11-13', total_sales: 22000, cgs: 18000, gross_profit: 4000, cgst: 1000, sgst: 1000, net_profit: 2000 },
    { date: '2026-11-12', total_sales: 15000, cgs: 11000, gross_profit: 4000, cgst: 700, sgst: 700, net_profit: 2600 },
  ];

  const handleExport = () => {
    exportToExcel(reportData, `Vimal_Vyapar_P&L_Report_${reportType}`);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 color="#38bdf8" size={32} /> Profit & Loss Reports
        </h1>
        <button onClick={handleExport} className="btn-success">
          <Download size={18} /> Download Excel Report
        </button>
      </div>

      <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar color="#888" />
          <span style={{ color: '#888' }}>Select Report Range:</span>
        </div>
        <select 
          style={{ width: '200px', margin: 0 }} 
          value={reportType} 
          onChange={(e) => setReportType(e.target.value)}
        >
          <option value="daily">Daily Report</option>
          <option value="monthly">Monthly Report</option>
          <option value="custom">Custom Date Range</option>
        </select>
        
        {reportType === 'custom' && (
           <div style={{ display: 'flex', gap: '10px' }}>
             <input type="date" style={{ margin: 0, width:'150px' }} />
             <span style={{color:'#888', alignSelf:'center'}}>to</span>
             <input type="date" style={{ margin: 0, width:'150px' }} />
           </div>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Sales (Gross)</th>
              <th>Cost of Goods (COGS)</th>
              <th>Gross Margin</th>
              <th>CGST Collected</th>
              <th>SGST Collected</th>
              <th style={{ color: '#22c55e' }}>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, i) => (
              <tr key={i}>
                <td style={{ color: '#888' }}>{row.date}</td>
                <td style={{ fontWeight: 'bold' }}>₹ {row.total_sales.toLocaleString()}</td>
                <td style={{ color: '#ef4444' }}>₹ {row.cgs.toLocaleString()}</td>
                <td style={{ color: '#38bdf8' }}>₹ {row.gross_profit.toLocaleString()}</td>
                <td>₹ {row.cgst.toLocaleString()}</td>
                <td>₹ {row.sgst.toLocaleString()}</td>
                <td style={{ color: '#22c55e', fontSize: '18px', fontWeight: 'bold' }}>₹ {row.net_profit.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}