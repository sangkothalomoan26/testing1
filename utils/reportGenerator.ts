
import type { Provider, Voucher, AtmLedger, AtmTransaction, Balance } from '../types';
import { formatCurrency } from './helpers';

// Since we are using the global jspdf from the script tag
declare const jspdf: any;

const formatRp = (amount: number) => formatCurrency(amount).replace('Rp', 'Rp ');

export const generateCompleteReport = (providers: Provider[], vouchers: Voucher[]): string => {
  let report = 'LAPORAN LENGKAP VOUCHER INTERNET UNI BRILINK\n\n';
  let grandTotalSales = 0;
  let grandTotalProfit = 0;

  providers.forEach(provider => {
    const providerVouchers = vouchers.filter(v => v.providerId === provider.id);
    if (providerVouchers.length === 0) return;

    report += `===== ${provider.name.toUpperCase()} =====\n\n`;
    let subTotalSales = 0;
    let subTotalProfit = 0;

    providerVouchers.forEach(v => {
      const sold = v.totalStock - v.remainingStock;
      const totalSales = sold * v.sellPrice;
      const totalCostOfSold = sold * v.costPrice;
      const profit = totalSales - totalCostOfSold;

      subTotalSales += totalSales;
      subTotalProfit += profit;

      report += `- ${v.name}\n`;
      report += `=================\n`;
      report += `Harga Modal : ${formatRp(v.costPrice)}\n`;
      report += `Harga Jual  : ${formatRp(v.sellPrice)}\n`;
      report += `--- Rincian Stok ---\n`;
      report += `Total Stok  : ${v.totalStock} pcs\n`;
      report += `Terjual     : ${sold} pcs\n`;
      report += `Sisa        : ${v.remainingStock} pcs\n`;
      report += `--- Rincian Keuangan ---\n`;
      report += `Total Penjualan       : ${formatRp(totalSales)}\n`;
      report += `Total Modal (Terjual) : ${formatRp(totalCostOfSold)}\n`;
      report += `Keuntungan            : ${formatRp(profit)}\n\n`;
    });
    
    grandTotalSales += subTotalSales;
    grandTotalProfit += subTotalProfit;

    report += `--- Sub-Total ${provider.name} ---\n`;
    report += `Total Penjualan : ${formatRp(subTotalSales)}\n`;
    report += `Total Keuntungan: ${formatRp(subTotalProfit)}\n`;
    report += `------------------------\n\n`;
  });

  report += `===== TOTAL KESELURUHAN =====\n`;
  report += `Total Seluruh Penjualan : ${formatRp(grandTotalSales)}\n`;
  report += `Total Seluruh Keuntungan: ${formatRp(grandTotalProfit)}\n\n`;
  report += `Created by : Sangkot Halomoan`;

  return report;
};

export const generateShortReport = (providers: Provider[], vouchers: Voucher[]): string => {
  let report = 'LAPORAN SISA & RENCANA TAMBAH STOK VOUCHER\n\n';
  let grandTotalPlannedCost = 0;

  providers.forEach(provider => {
    const providerVouchers = vouchers.filter(v => v.providerId === provider.id);
    if (providerVouchers.length === 0) return;

    report += `===== ${provider.name.toUpperCase()} =====\n\n`;
    let subTotalPlannedCost = 0;

    providerVouchers.forEach(v => {
      report += `- ${v.name}\n`;
      report += `Sisa Stok : ${v.remainingStock} pcs\n`;
      if (v.plannedStock > 0) {
        const estimatedCost = v.plannedStock * v.costPrice;
        subTotalPlannedCost += estimatedCost;
        report += `*Rencana Tambah Stok : ${v.plannedStock} Pcs x ${formatRp(v.costPrice)} = ${formatRp(estimatedCost)}*\n`;
      }
      report += `\n`;
    });
    
    grandTotalPlannedCost += subTotalPlannedCost;
    
    report += `--- *Sub-Total Modal ${provider.name}* ---\n`;
    report += `Total Rencana Tambah Stok    : ${formatRp(subTotalPlannedCost)}\n`;
    report += `---------------------------\n\n`;
  });

  report += ` *••TOTAL KESELURUHAN MODAL••*\n`;
  report += `Total Harga Tambah Stok    : ${formatRp(grandTotalPlannedCost)}\n\n`;
  report += `Dilaporkan Oleh : Sangkot Halomoan`;

  return report;
};

const getReceiptCSS = () => `...`; // Omitted for brevity, no changes here

const createReceiptHTML = (title: string, bodyContent: string, footer: string) => `...`; // Omitted for brevity, no changes here

export const generateCompleteReceiptHTML = (providers: Provider[], vouchers: Voucher[]): string => `...`; // Omitted for brevity, no changes here

export const generateShortReceiptHTML = (providers: Provider[], vouchers: Voucher[]): string => `...`; // Omitted for brevity, no changes here

// --- New PDF Generation Function for Mini ATM ---

export const generateLedgerPdf = (ledger: AtmLedger, transactions: AtmTransaction[]) => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF();

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Header
  doc.setFontSize(18);
  doc.text('Laporan Pembukuan Mini ATM', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(ledger.name, 105, 28, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Tanggal: ${formatDate(ledger.date)}`, 105, 34, { align: 'center' });

  // Balance Summary Table
  const balanceBody = (balance: Balance) => [
    ['BRI', formatCurrency(balance.bri)],
    ['Mandiri', formatCurrency(balance.mandiri)],
    ['DANA', formatCurrency(balance.dana)],
    ['SavePlus', formatCurrency(balance.savePlus)],
    ['Tunai (CASH)', formatCurrency(balance.cash)],
    [{ content: 'TOTAL', styles: { fontStyle: 'bold' } }, { content: formatCurrency(Object.values(balance).reduce((a, b) => a + b, 0)), styles: { fontStyle: 'bold' } }],
  ];

  doc.autoTable({
    startY: 45,
    head: [['Saldo Awal', 'Jumlah']],
    body: balanceBody(ledger.initialBalance),
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: { 1: { halign: 'right' } },
  });

  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 2,
    head: [['Saldo Akhir', 'Jumlah']],
    body: balanceBody(ledger.currentBalance),
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74] },
    columnStyles: { 1: { halign: 'right' } },
  });

  // Transactions Table
  doc.setFontSize(14);
  doc.text('Rincian Transaksi', 14, doc.autoTable.previous.finalY + 15);

  const transactionBody = transactions.map(tx => [
    formatTime(tx.timestamp),
    tx.typeName,
    formatCurrency(tx.amount),
    formatCurrency(tx.agentAdmin),
    tx.notes,
  ]);

  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 20,
    head: [['Waktu', 'Jenis Transaksi', 'Nominal', 'Admin Agen', 'Catatan']],
    body: transactionBody,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`UNI BRILINK - Halaman ${i} dari ${pageCount}`, 105, 290, { align: 'center' });
  }

  doc.save(`Laporan_${ledger.name.replace(/ /g, '_')}_${formatDate(ledger.date)}.pdf`);
};
