import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename) => {
  if(!data || data.length === 0) return alert("No data to export!");
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};