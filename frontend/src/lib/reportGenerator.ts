import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Invoice, LowStockItem } from '@/types/invoice';
import { format } from 'date-fns';

// Monthly Revenue Report
export const generateMonthlyRevenuePDF = (invoices: Invoice[], month: number, year: number) => {
  const doc = new jsPDF();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Title
  doc.setFontSize(18);
  doc.text('Monthly Revenue Report', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`${monthNames[month]} ${year}`, 14, 28);
  
  // Calculate totals
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalProfit = invoices.reduce((sum, inv) => sum + (inv.total - inv.tax), 0);
  const totalInvoices = invoices.length;
  
  // Summary
  doc.setFontSize(10);
  doc.text(`Total Invoices: ${totalInvoices}`, 14, 38);
  doc.text(`Total Revenue: Rs. ${totalRevenue.toFixed(2)}`, 14, 45);
  doc.text(`Total Profit: Rs. ${totalProfit.toFixed(2)}`, 14, 52);
  
  // Table
  const tableData = invoices.map(inv => [
    inv.invoiceNumber,
    format(inv.date, 'dd/MM/yyyy'),
    inv.customerName,
    inv.items.length.toString(),
    `Rs. ${inv.total.toFixed(2)}`,
    inv.status
  ]);
  
  autoTable(doc, {
    startY: 60,
    head: [['Invoice #', 'Date', 'Customer', 'Items', 'Total', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  doc.save(`monthly-revenue-${year}-${month + 1}.pdf`);
};

export const generateMonthlyRevenueExcel = (invoices: Invoice[], month: number, year: number) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalProfit = invoices.reduce((sum, inv) => sum + (inv.total - inv.tax), 0);
  
  const data = [
    ['Monthly Revenue Report'],
    [`${monthNames[month]} ${year}`],
    [],
    ['Total Invoices:', invoices.length],
    ['Total Revenue:', `Rs. ${totalRevenue.toFixed(2)}`],
    ['Total Profit:', `Rs. ${totalProfit.toFixed(2)}`],
    [],
    ['Invoice #', 'Date', 'Customer', 'Phone', 'Items', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment', 'Status'],
    ...invoices.map(inv => [
      inv.invoiceNumber,
      format(inv.date, 'dd/MM/yyyy'),
      inv.customerName,
      inv.customerPhone || 'N/A',
      inv.items.length,
      inv.subtotal.toFixed(2),
      inv.tax.toFixed(2),
      inv.discount.toFixed(2),
      inv.total.toFixed(2),
      inv.paymentMethod,
      inv.status
    ])
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Monthly Revenue');
  
  XLSX.writeFile(wb, `monthly-revenue-${year}-${month + 1}.xlsx`);
};

// Annual Revenue & Profit Report
export const generateAnnualRevenuePDF = (invoices: Invoice[], year: number) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('Annual Revenue & Profit Report', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Year: ${year}`, 14, 28);
  
  // Group by month
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthInvoices = invoices.filter(
      inv => inv.date.getMonth() === i && inv.date.getFullYear() === year
    );
    
    return {
      month: format(new Date(year, i, 1), 'MMMM'),
      revenue: monthInvoices.reduce((sum, inv) => sum + inv.total, 0),
      profit: monthInvoices.reduce((sum, inv) => sum + (inv.total - inv.tax), 0),
      invoices: monthInvoices.length
    };
  });
  
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const totalProfit = monthlyData.reduce((sum, m) => sum + m.profit, 0);
  const totalInvoices = monthlyData.reduce((sum, m) => sum + m.invoices, 0);
  
  // Summary
  doc.setFontSize(10);
  doc.text(`Total Invoices: ${totalInvoices}`, 14, 38);
  doc.text(`Total Revenue: Rs. ${totalRevenue.toFixed(2)}`, 14, 45);
  doc.text(`Total Profit: Rs. ${totalProfit.toFixed(2)}`, 14, 52);
  doc.text(`Average Monthly Revenue: Rs. ${(totalRevenue / 12).toFixed(2)}`, 14, 59);
  
  // Table
  const tableData = monthlyData.map(m => [
    m.month,
    m.invoices.toString(),
    `Rs. ${m.revenue.toFixed(2)}`,
    `Rs. ${m.profit.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: 68,
    head: [['Month', 'Invoices', 'Revenue', 'Profit']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    foot: [['Total', totalInvoices.toString(), `Rs. ${totalRevenue.toFixed(2)}`, `Rs. ${totalProfit.toFixed(2)}`]],
    footStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
  });
  
  doc.save(`annual-revenue-${year}.pdf`);
};

export const generateAnnualRevenueExcel = (invoices: Invoice[], year: number) => {
  // Group by month
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthInvoices = invoices.filter(
      inv => inv.date.getMonth() === i && inv.date.getFullYear() === year
    );
    
    return {
      month: format(new Date(year, i, 1), 'MMMM'),
      revenue: monthInvoices.reduce((sum, inv) => sum + inv.total, 0),
      profit: monthInvoices.reduce((sum, inv) => sum + (inv.total - inv.tax), 0),
      invoices: monthInvoices.length
    };
  });
  
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const totalProfit = monthlyData.reduce((sum, m) => sum + m.profit, 0);
  const totalInvoices = monthlyData.reduce((sum, m) => sum + m.invoices, 0);
  
  const data = [
    ['Annual Revenue & Profit Report'],
    [`Year: ${year}`],
    [],
    ['Total Invoices:', totalInvoices],
    ['Total Revenue:', `Rs. ${totalRevenue.toFixed(2)}`],
    ['Total Profit:', `Rs. ${totalProfit.toFixed(2)}`],
    ['Average Monthly Revenue:', `Rs. ${(totalRevenue / 12).toFixed(2)}`],
    [],
    ['Month', 'Invoices', 'Revenue', 'Profit'],
    ...monthlyData.map(m => [
      m.month,
      m.invoices,
      m.revenue.toFixed(2),
      m.profit.toFixed(2)
    ]),
    [],
    ['Total', totalInvoices, totalRevenue.toFixed(2), totalProfit.toFixed(2)]
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Annual Revenue');
  
  XLSX.writeFile(wb, `annual-revenue-${year}.xlsx`);
};

// Low Stock Report
export const generateLowStockPDF = (lowStockItems: LowStockItem[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('Low Stock Report', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 28);
  
  // Summary
  doc.setFontSize(10);
  doc.text(`Total Items Below Minimum Stock: ${lowStockItems.length}`, 14, 38);
  
  // Table
  const tableData = lowStockItems.map(item => [
    item.productName,
    item.category,
    item.currentStock.toString(),
    item.minStock.toString(),
    item.reorderQuantity.toString()
  ]);
  
  autoTable(doc, {
    startY: 48,
    head: [['Product', 'Category', 'Current Stock', 'Min Stock', 'Reorder Qty']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68] },
  });
  
  doc.save(`low-stock-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateLowStockExcel = (lowStockItems: LowStockItem[]) => {
  const data = [
    ['Low Stock Report'],
    [`Generated: ${format(new Date(), 'PPP')}`],
    [],
    ['Total Items Below Minimum Stock:', lowStockItems.length],
    [],
    ['Product ID', 'Product Name', 'Category', 'Current Stock', 'Min Stock', 'Reorder Quantity'],
    ...lowStockItems.map(item => [
      item.productId,
      item.productName,
      item.category,
      item.currentStock,
      item.minStock,
      item.reorderQuantity
    ])
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Low Stock');
  
  XLSX.writeFile(wb, `low-stock-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};
