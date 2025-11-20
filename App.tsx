
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Clipboard, Landmark, Wifi, PlusCircle, Trash2, Download, ExternalLink } from 'lucide-react';
import type { User } from 'firebase/auth';
import { format } from 'date-fns';

import { useFirestoreStore } from './hooks/useFirestoreStore';
import { useAtmStore } from './hooks/useAtmStore';
import { useTheme } from './hooks/useTheme';

import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Dashboard } from './components/dashboard/Dashboard';
import { ProviderView } from './components/provider/ProviderView';
import { SalesView } from './components/sales/SalesView';
import { Modal } from './components/common/Modal';
import { Toast } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AtmDashboard } from './components/atm/AtmDashboard';
import { CreateLedger } from './components/atm/CreateLedger';
import { AtmLedger, Balance } from './types';

import { generateCompleteReport, generateShortReport, generateCompleteReceiptHTML, generateShortReceiptHTML, generateLedgerPdf } from './utils/reportGenerator';
import { calculateAutoSellPrice, formatCurrency, formatNumberWithSeparators, parseFormattedNumber } from './utils/helpers';
import type { Provider, Voucher, ToastMessage, ActivityLog } from './types';

// Voucher Module Component (Self-contained)
const VOUCHER_FORM_DEFAULTS: Omit<Voucher, 'id' | 'providerId' | 'name'> = { totalStock: 0, remainingStock: 0, costPrice: 0, sellPrice: 0, plannedStock: 0 };
const VoucherModule: React.FC<{ user: User; firestoreStore: ReturnType<typeof useFirestoreStore>, addToast: (type: ToastMessage['type'], message: React.ReactNode) => void }> = ({ user, firestoreStore, addToast }) => {
    // ... existing voucher module code ... no changes needed here, only addToast is passed in.
    const { providers, vouchers, activityLogs, loading: dataLoading, addProvider, findProviderByOriginalId, deleteProvider, upsertVoucher, updateVoucher, deleteVoucher, addLog } = firestoreStore;
    const [currentView, setCurrentView] = useState<'dashboard' | 'provider' | 'sales'>('dashboard');
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [isVoucherFormOpen, setIsVoucherFormOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
    const [voucherFormData, setVoucherFormData] = useState<Partial<Voucher>>({});
    const [isAddProviderModalOpen, setIsAddProviderModalOpen] = useState(false);
    const [deletingVoucher, setDeletingVoucher] = useState<Voucher | null>(null);
    const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportContent, setReportContent] = useState('');
    const [reportTitle, setReportTitle] = useState('');
    const [stockToAdd, setStockToAdd] = useState<{voucher: Voucher | null, quantity: string}>({ voucher: null, quantity: ''});
    const [isPrintChoiceModalOpen, setIsPrintChoiceModalOpen] = useState(false);
    const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const allVoucherNames = useMemo(() => { const gbs: string[] = []; for (let i = 1; i <= 15; i += 0.5) gbs.push(`${Number.isInteger(i) ? i.toString() : i.toString()}GB`); const days = [1, 2, 3, 5, 7, 10, 14, 30]; const suggestions: string[] = []; gbs.forEach(gb => days.forEach(day => suggestions.push(`${gb} / ${day} Hari`))); return suggestions; }, []);
    const [voucherNameSuggestions, setVoucherNameSuggestions] = useState<string[]>([]);
    
    const handleSelectProvider = (id: string) => { setSelectedProviderId(id); setCurrentView('provider'); };
    const handleBackToDashboard = () => { setSelectedProviderId(null); setCurrentView('dashboard'); };
    const handleGoToSales = () => setCurrentView('sales');
    const handleOpenAddVoucher = (providerId: string) => { setEditingVoucher(null); setVoucherFormData({ providerId, ...VOUCHER_FORM_DEFAULTS }); setIsVoucherFormOpen(true); };
    const handleOpenEditVoucher = (voucher: Voucher) => { setEditingVoucher(voucher); setVoucherFormData(voucher); setIsVoucherFormOpen(true); };
    const handleVoucherFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'name') {
            if (value.trim()) setVoucherNameSuggestions(allVoucherNames.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 5));
            else setVoucherNameSuggestions([]);
        }
        setVoucherFormData(prev => { const newFormData = { ...prev }; const isNumeric = ['costPrice', 'sellPrice', 'totalStock', 'remainingStock', 'plannedStock'].includes(name); if (isNumeric) newFormData[name as keyof Voucher] = parseFormattedNumber(value); else newFormData[name as keyof Voucher] = value as string; if (name === 'costPrice' && !voucherFormData.sellPrice) newFormData.sellPrice = calculateAutoSellPrice(newFormData.costPrice || 0); return newFormData; });
    };
    const handleSuggestionClick = (suggestion: string) => { setVoucherFormData(prev => ({ ...prev, name: suggestion })); setVoucherNameSuggestions([]); };
    const handleVoucherFormSubmit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const finalData = { ...voucherFormData } as Voucher; upsertVoucher(finalData); addLog('EDIT', editingVoucher ? `Voucher "${finalData.name}" diperbarui.` : `Voucher "${finalData.name}" ditambahkan.`); addToast('success', `Voucher "${finalData.name}" berhasil ${editingVoucher ? 'diperbarui' : 'ditambahkan'}.`); setIsVoucherFormOpen(false); setVoucherNameSuggestions([]); };
    const handleAddProviderSubmit = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const name = (e.currentTarget.elements.namedItem('providerName') as HTMLInputElement).value; const logoUrl = (e.currentTarget.elements.namedItem('providerLogoUrl') as HTMLInputElement).value; 
        // Fix: Use reduce to robustly find the maximum originalId and avoid type inference issues by explicitly typing parameters.
        const nextOriginalId = providers.length > 0 ? providers.reduce((max: number, p: Provider) => Math.max(max, p.originalId), 0) + 1 : 1;
        await addProvider({ name, logoUrl: logoUrl || undefined, originalId: nextOriginalId }); 
        addToast('success', `Provider "${name}" berhasil ditambahkan.`); 
        setIsAddProviderModalOpen(false); 
    };
    const confirmDeleteVoucher = () => { if (deletingVoucher) { deleteVoucher(deletingVoucher.id); addLog('DELETE_VOUCHER', `Voucher "${deletingVoucher.name}" dihapus.`); addToast('success', `Voucher "${deletingVoucher.name}" berhasil dihapus.`); setDeletingVoucher(null); } };
    const confirmDeleteProvider = () => { if(deletingProvider) { deleteProvider(deletingProvider.id); addLog('DELETE_PROVIDER', `Provider "${deletingProvider.name}" dihapus.`); addToast('success', `Provider "${deletingProvider.name}" berhasil dihapus.`); setDeletingProvider(null); setCurrentView('dashboard'); setSelectedProviderId(null); }};
    const handleConfirmAddStock = () => { if (!stockToAdd.voucher || !stockToAdd.quantity) return; const quantity = parseInt(stockToAdd.quantity, 10); if (isNaN(quantity) || quantity <= 0) return; const updatedVoucher = { ...stockToAdd.voucher }; updatedVoucher.totalStock += quantity; updatedVoucher.remainingStock += quantity; updatedVoucher.plannedStock = Math.max(0, updatedVoucher.plannedStock - quantity); updateVoucher(updatedVoucher); addLog('ADD_STOCK', `${quantity} stok ditambahkan ke "${updatedVoucher.name}".`); addToast('success', `${quantity} stok berhasil ditambahkan.`); setStockToAdd({ voucher: null, quantity: ''}); };
    const handleCompleteSale = (cart: Record<string, number>) => { let totalSalePrice = 0; const saleDetails: string[] = []; Object.entries(cart).forEach(([voucherId, quantity]) => { const voucher = vouchers.find(v => v.id === voucherId); if (voucher && voucher.remainingStock >= quantity) { updateVoucher({ ...voucher, remainingStock: voucher.remainingStock - quantity }); totalSalePrice += voucher.sellPrice * quantity; saleDetails.push(`${quantity}x ${voucher.name}`); } }); if (saleDetails.length > 0) { addLog('SALE', `Penjualan: ${saleDetails.join(', ')} | Total: ${formatCurrency(totalSalePrice)}.`); addToast('success', 'Penjualan berhasil!'); setCurrentView('dashboard'); } else addToast('error', 'Gagal memproses penjualan.'); };
    const handleGenerateReport = (type: 'complete' | 'short') => { setReportTitle(type === 'complete' ? 'Laporan Lengkap' : 'Laporan Singkat'); setReportContent(type === 'complete' ? generateCompleteReport(providers, vouchers) : generateShortReport(providers, vouchers)); setIsReportModalOpen(true); };
    const copyReportToClipboard = () => { navigator.clipboard.writeText(reportContent); addToast('success', 'Laporan disalin ke clipboard.'); };
    const handlePrintReceipt = useCallback(() => setIsPrintChoiceModalOpen(true), []);
    const handlePrintSelectedReceipt = useCallback((type: 'complete' | 'short') => { setIsPrintChoiceModalOpen(false); const receiptHtml = type === 'complete' ? generateCompleteReceiptHTML(providers, vouchers) : generateShortReceiptHTML(providers, vouchers); const printWindow = window.open('', '_blank'); if (printWindow) { printWindow.document.write(receiptHtml); printWindow.document.close(); printWindow.focus(); printWindow.print(); } else addToast('error', 'Gagal membuka jendela cetak.'); }, [providers, vouchers, addToast]);
    const handleUploadClick = () => fileInputRef.current?.click();
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (e) => { try { const data = new Uint8Array(e.target?.result as ArrayBuffer); const workbook = XLSX.read(data, { type: 'array' }); const json: (string|number)[][] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }); let successCount = 0; for (const row of json.slice(1)) { if (row.length === 0) continue; const [providerId, name, totalStock, remainingStock, costPrice, sellPrice, plannedStock] = row; if (!providerId || !name) continue; const parsedProviderId = Number(providerId); let provider = await findProviderByOriginalId(parsedProviderId); if (!provider) { const newProviderName = `Provider ${parsedProviderId}`; await addProvider({ name: newProviderName, originalId: parsedProviderId }); provider = await findProviderByOriginalId(parsedProviderId); } if (!provider) continue; await upsertVoucher({ providerId: provider.id, name: String(name), totalStock: Number(totalStock || 0), remainingStock: Number(remainingStock ?? totalStock ?? 0), costPrice: Number(costPrice) || 0, sellPrice: (sellPrice != null && sellPrice !== '' && !isNaN(Number(sellPrice))) ? Number(sellPrice) : calculateAutoSellPrice(Number(costPrice)), plannedStock: Number(plannedStock || 0) }); successCount++; } if (successCount > 0) { addLog('IMPORT', `Mengimpor ${successCount} voucher dari Excel.`); addToast('success', `${successCount} data berhasil diimpor.`); } } catch (err) { addToast('error', 'Gagal memproses file Excel.'); } }; reader.readAsArrayBuffer(file); event.target.value = ''; };
    const selectedProvider = providers.find(p => p.id === selectedProviderId);
    const estimatedPlannedCost = (voucherFormData.plannedStock || 0) * (voucherFormData.costPrice || 0);
    const renderVoucherContent = () => { if(dataLoading) return <div className="text-center p-10">Memuat data voucher...</div>; switch(currentView) { case 'provider': return selectedProvider ? (<ProviderView {...{provider: selectedProvider, vouchers: vouchers.filter(v => v.providerId === selectedProviderId), onBack: handleBackToDashboard, onAddVoucher: handleOpenAddVoucher, onEditVoucher: handleOpenEditVoucher, onDeleteVoucher: v => setDeletingVoucher(v), onDeleteProvider: p => setDeletingProvider(p), onAddStock: v => setStockToAdd({ voucher: v, quantity: '' })}} />) : null; case 'sales': return <SalesView {...{providers, vouchers, onBack: handleBackToDashboard, onCompleteSale: handleCompleteSale}} />; default: return <Dashboard {...{providers, vouchers, onSelectProvider: handleSelectProvider, onUploadClick: handleUploadClick, onAddProviderClick: () => setIsAddProviderModalOpen(true), onGoToSales: handleGoToSales}} />; } };
    return (
        <div className="space-y-8">
            {renderVoucherContent()}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
            <Modal isOpen={isVoucherFormOpen} onClose={() => { setIsVoucherFormOpen(false); setVoucherNameSuggestions([]); }} title={editingVoucher ? 'Edit Voucher' : 'Tambah Voucher Baru'}> <form onSubmit={handleVoucherFormSubmit} className="space-y-4"> <input type="hidden" name="providerId" value={voucherFormData.providerId || ''} /> <div className="relative"> <label className="block text-sm font-medium">Nama Voucher</label> <input name="name" value={voucherFormData.name || ''} onChange={handleVoucherFormChange} onBlur={() => setTimeout(() => setVoucherNameSuggestions([]), 200)} autoComplete="off" required className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg" /> {voucherNameSuggestions.length > 0 && (<ul className="absolute z-10 w-full mt-1 bg-light-card dark:bg-navy-700 border rounded-md shadow-lg max-h-48 overflow-y-auto"> {voucherNameSuggestions.map(s => <li key={s} onMouseDown={() => handleSuggestionClick(s)} className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-navy-800">{s}</li>)} </ul>)} </div> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-sm font-medium">Total Stok</label> <input name="totalStock" type="number" value={voucherFormData.totalStock ?? ''} onChange={handleVoucherFormChange} required className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg" /> </div> <div> <label className="block text-sm font-medium">Sisa Stok</label> <input name="remainingStock" type="number" value={voucherFormData.remainingStock ?? ''} onChange={handleVoucherFormChange} required className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg" /> </div> <div> <label className="block text-sm font-medium">Harga Modal</label> <input name="costPrice" value={formatNumberWithSeparators(voucherFormData.costPrice ?? '')} onChange={handleVoucherFormChange} required className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg" /> </div> <div> <label className="block text-sm font-medium">Harga Jual</label> <input name="sellPrice" value={formatNumberWithSeparators(voucherFormData.sellPrice ?? '')} onChange={handleVoucherFormChange} required className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg" /> </div> <div className="col-span-2"> <label className="block text-sm font-medium">Rencana Tambah Stok</label> <input name="plannedStock" type="number" value={voucherFormData.plannedStock ?? ''} onChange={handleVoucherFormChange} className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg" /> {estimatedPlannedCost > 0 && (<p className="text-xs mt-1">Estimasi biaya: <strong>{formatCurrency(estimatedPlannedCost)}</strong></p>)} </div> </div> <div className="pt-4 flex justify-end"> <button type="submit" className="px-6 py-2 bg-gold-500 text-navy-900 font-bold rounded-lg">Simpan</button> </div> </form> </Modal>
            <Modal isOpen={isAddProviderModalOpen} onClose={() => setIsAddProviderModalOpen(false)} title="Tambah Provider Baru"><form onSubmit={handleAddProviderSubmit} className="space-y-4"><input name="providerName" required placeholder="Nama Provider" className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg" /><input name="providerLogoUrl" type="url" placeholder="URL Logo (Opsional)" className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg" /><div className="pt-4 flex justify-end"><button type="submit" className="px-6 py-2 bg-gold-500 text-navy-900 font-bold rounded-lg">Tambah</button></div></form></Modal>
            <Modal isOpen={!!stockToAdd.voucher} onClose={() => setStockToAdd({ voucher: null, quantity: '' })} title={`Tambah Stok: ${stockToAdd.voucher?.name}`}> <div className="space-y-4"> <input type="number" value={stockToAdd.quantity} onChange={(e) => setStockToAdd(p => ({ ...p, quantity: e.target.value }))} autoFocus placeholder="Jumlah tambahan" className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg" /> <div className="pt-4 flex justify-end gap-4"> <button onClick={() => setStockToAdd({ voucher: null, quantity: '' })} className="px-6 py-2 rounded-lg bg-gray-300 dark:bg-navy-700">Batal</button> <button onClick={handleConfirmAddStock} className="px-6 py-2 bg-gold-500 text-navy-900 font-bold rounded-lg">Tambah</button> </div> </div> </Modal>
            <Modal isOpen={!!deletingVoucher} onClose={() => setDeletingVoucher(null)} title="Konfirmasi Hapus"><p>Yakin hapus <strong>{deletingVoucher?.name}</strong>?</p><div className="mt-6 flex justify-end gap-4"><button onClick={() => setDeletingVoucher(null)} className="px-6 py-2 rounded-lg">NO</button><button onClick={confirmDeleteVoucher} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg">YES</button></div></Modal>
            <Modal isOpen={!!deletingProvider} onClose={() => setDeletingProvider(null)} title="Konfirmasi Hapus"><p>Yakin hapus <strong>{deletingProvider?.name}</strong>?</p><div className="mt-6 flex justify-end gap-4"><button onClick={() => setDeletingProvider(null)} className="px-6 py-2 rounded-lg">NO</button><button onClick={confirmDeleteProvider} className="px-6 py-2 bg-red-600 text-white rounded-lg">YES</button></div></Modal>
            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title={reportTitle}><div className="max-h-96 overflow-y-auto bg-gray-100 dark:bg-navy-900 p-4 rounded-lg"><pre className="text-xs whitespace-pre-wrap">{reportContent}</pre></div><div className="mt-6 flex justify-end"><button onClick={copyReportToClipboard} className="flex items-center gap-2 px-6 py-2 bg-gold-500 text-navy-900 rounded-lg"><Clipboard size={18}/>Copy</button></div></Modal>
            <Modal isOpen={isPrintChoiceModalOpen} onClose={() => setIsPrintChoiceModalOpen(false)} title="Pilih Resi"><div className="flex flex-col gap-4"><button onClick={() => handlePrintSelectedReceipt('complete')} className="w-full px-6 py-3 bg-navy-700 text-white rounded-lg">Laporan Lengkap</button><button onClick={() => handlePrintSelectedReceipt('short')} className="w-full px-6 py-3 bg-gold-500 text-navy-900 rounded-lg">Laporan Singkat</button></div></Modal>
            <Modal isOpen={isActivityLogOpen} onClose={() => setIsActivityLogOpen(false)} title="Riwayat Aktivitas"><div className="max-h-96 overflow-y-auto space-y-3 pr-2">{activityLogs.length > 0 ? activityLogs.map(log => (<div key={log.id} className="text-sm p-3 bg-gray-100 dark:bg-navy-800 rounded-lg"><p className="font-semibold">{log.message}</p><p className="text-xs text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString('id-ID')}</p></div>)) : <p>Belum ada aktivitas.</p>}</div></Modal>
        </div>
    );
}

// ATM Module Component (Self-contained)
const LedgerSelection: React.FC<{
    ledgers: AtmLedger[];
    onSelectLedger: (ledgerId: string) => void;
    onCreateLedger: () => void;
    onDeleteLedger: (ledger: AtmLedger) => void;
    onDownloadPdf: (ledger: AtmLedger) => void;
}> = ({ ledgers, onSelectLedger, onCreateLedger, onDeleteLedger, onDownloadPdf }) => {
    return (
        <div className="bg-light-card dark:bg-dark-card p-4 md:p-6 rounded-xl shadow-lg border border-white/10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-navy-800 dark:text-gold-400">Daftar Sesi Pembukuan</h2>
                <button onClick={onCreateLedger} className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-navy-900 font-bold rounded-lg shadow-md hover:bg-gold-600 hover:shadow-soft-glow transition-all">
                    <PlusCircle size={18} /> Buat Pembukuan Baru
                </button>
            </div>
            {ledgers.length > 0 ? (
                <div className="space-y-3">
                    {ledgers.map(ledger => (
                        <div key={ledger.id} className="p-4 bg-gray-50 dark:bg-navy-800 rounded-lg flex justify-between items-center group">
                            <div onClick={() => onSelectLedger(ledger.id)} className="flex-grow cursor-pointer">
                                <p className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-gold-500 transition-colors">{ledger.name}</p>
                                <p className="text-sm text-gray-500">{format(new Date(ledger.date), 'eeee, dd MMMM yyyy')}</p>
                            </div>
                            <div className="text-right flex-shrink-0 mr-4">
                                <p className="text-sm text-gray-500">Saldo Akhir</p>
                                <p className="font-bold text-green-500">{formatCurrency(Object.values(ledger.currentBalance || {}).reduce((a, b) => a + Number(b), 0))}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); onDownloadPdf(ledger); }} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full transition-colors"><Download size={18}/></button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteLedger(ledger); }} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-gray-500">Belum ada sesi pembukuan.</p>
                    <p className="text-gray-500">Klik "Buat Pembukuan Baru" untuk memulai.</p>
                </div>
            )}
        </div>
    );
};

const AtmModule: React.FC<{ atmStore: ReturnType<typeof useAtmStore>, addToast: (type: ToastMessage['type'], message: React.ReactNode) => void }> = ({ atmStore, addToast }) => {
    const { ledgers, transactions, loading, createLedger, deleteLedger, getTransactionsForLedger } = atmStore;
    const [view, setView] = useState<'list' | 'dashboard' | 'create'>('list');
    const [activeLedgerId, setActiveLedgerId] = useState<string | null>(null);
    const [deletingLedger, setDeletingLedger] = useState<AtmLedger | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (activeLedgerId) {
            let unsubscribe: () => void;
            try {
                unsubscribe = atmStore.fetchTransactionsForLedger(activeLedgerId);
            } catch (error: any) {
                if (error.message.startsWith('MISSING_INDEX::')) {
                    const url = error.message.split('::')[1];
                    const link = <a href={url} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-400 flex items-center gap-1">Klik di sini untuk membuat indeks Firebase <ExternalLink size={14}/></a>;
                    addToast('error', <><span>Gagal memuat transaksi. Indeks Firestore diperlukan. </span>{link}</>);
                } else {
                    addToast('error', `Error: ${error.message}`);
                }
            }
            return () => {
                if (unsubscribe) unsubscribe();
            };
        }
    }, [activeLedgerId, atmStore.fetchTransactionsForLedger, addToast]);
    
    const handleCreateLedger = async (name: string, initialBalance: Balance) => {
        await createLedger(name, initialBalance);
        setView('list');
    };
    
    const confirmDeleteLedger = () => {
        if(deletingLedger) {
            deleteLedger(deletingLedger.id).then(() => {
                addToast('success', `Pembukuan "${deletingLedger.name}" berhasil dihapus.`);
            }).catch(err => {
                addToast('error', 'Gagal menghapus pembukuan.');
            });
            setDeletingLedger(null);
        }
    };
    
    const handleDownloadPdf = async (ledger: AtmLedger) => {
        setIsDownloading(true);
        addToast('info', `Mempersiapkan laporan PDF untuk "${ledger.name}"...`);
        try {
            const ledgerTransactions = await getTransactionsForLedger(ledger.id);
            generateLedgerPdf(ledger, ledgerTransactions);
        } catch (error: any) {
            if (error.message.startsWith('MISSING_INDEX::')) {
                 const url = error.message.split('::')[1];
                 const link = <a href={url} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-400 flex items-center gap-1">Klik di sini untuk membuat indeks Firebase <ExternalLink size={14}/></a>;
                 addToast('error', <><span>Gagal membuat PDF. Indeks Firestore diperlukan. </span>{link}</>);
            } else {
                addToast('error', `Gagal membuat PDF: ${error.message}`);
            }
        } finally {
            setIsDownloading(false);
        }
    };

    const activeLedger = ledgers.find(l => l.id === activeLedgerId);

    if (loading) return <div className="text-center p-10">Memuat data Mini ATM...</div>;

    if (view === 'create') {
        return <CreateLedger createLedger={handleCreateLedger} onCancel={() => setView('list')} />;
    }
    
    if (view === 'dashboard' && activeLedger) {
        return <AtmDashboard 
            activeLedger={activeLedger} 
            transactions={transactions}
            onBack={() => { setView('list'); setActiveLedgerId(null); }}
            {...atmStore}
        />
    }

    return (
      <>
        <LedgerSelection 
            ledgers={ledgers} 
            onSelectLedger={(id) => { setActiveLedgerId(id); setView('dashboard'); }} 
            onCreateLedger={() => setView('create')}
            onDeleteLedger={setDeletingLedger}
            onDownloadPdf={handleDownloadPdf}
        />
        <Modal isOpen={!!deletingLedger} onClose={() => setDeletingLedger(null)} title="Konfirmasi Hapus Pembukuan">
            <p>Yakin ingin menghapus sesi pembukuan <strong>{deletingLedger?.name}</strong>? Tindakan ini tidak dapat diurungkan dan akan menghapus semua transaksinya.</p>
            <div className="mt-6 flex justify-end gap-4">
                <button onClick={() => setDeletingLedger(null)} className="px-6 py-2 rounded-lg">Batal</button>
                <button onClick={confirmDeleteLedger} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg">Hapus Permanen</button>
            </div>
        </Modal>
      </>
    );
}


const AppContent: React.FC<{ user: User; logout: () => Promise<void> }> = ({ user, logout }) => {
    const [theme, toggleTheme] = useTheme();
    const [activeTab, setActiveTab] = useState<'atm' | 'voucher'>('atm');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((type: ToastMessage['type'], message: React.ReactNode) => {
        setToasts(prev => [...prev, { id: Date.now(), type, message }]);
    }, []);
    const dismissToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);
    
    const firestoreStore = useFirestoreStore(user.uid);
    const atmStore = useAtmStore(user.uid);

    return (
        <div className="min-h-screen flex flex-col bg-light-bg dark:bg-dark-bg text-gray-800 dark:text-gray-200 transition-colors duration-300">
            <Header theme={theme} toggleTheme={toggleTheme} onGenerateReport={() => {}} onPrintReceipt={() => {}} onShowHistory={() => {}} onLogout={logout} isLoggedIn={!!user}/>
            
            <div className="container mx-auto px-4 md:px-8 mt-4">
                <div className="flex border-b border-gray-200 dark:border-navy-700">
                    <button onClick={() => setActiveTab('atm')} className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors ${activeTab === 'atm' ? 'border-b-2 border-gold-500 text-gold-500' : 'text-gray-500 hover:text-gold-400'}`}>
                        <Landmark size={18} /> Mini ATM
                    </button>
                    <button onClick={() => setActiveTab('voucher')} className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors ${activeTab === 'voucher' ? 'border-b-2 border-gold-500 text-gold-500' : 'text-gray-500 hover:text-gold-400'}`}>
                        <Wifi size={18} /> Voucher Internet
                    </button>
                </div>
            </div>

            <main className="flex-grow container mx-auto p-4 md:p-8">
                {activeTab === 'atm' && <AtmModule atmStore={atmStore} addToast={addToast} />}
                {activeTab === 'voucher' && <VoucherModule user={user} firestoreStore={firestoreStore} addToast={addToast} />}
            </main>
            <Footer />
            <div aria-live="assertive" className="fixed inset-0 flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 space-y-4 z-50">
                {toasts.map(toast => (<Toast key={toast.id} message={toast} onDismiss={dismissToast} />))}
            </div>
             <style>{`.animate-fade-in { animation: fade-in 0.5s ease-in-out; } @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

const App: React.FC = () => {
    // TEMPORARILY DISABLED LOGIN FOR TESTING
    const mockUser = {
      uid: 'TEST_USER_ID_12345',
      email: 'test@example.com',
    } as User;
    const mockLogout = async () => console.log("Logout function called in test mode.");
    
    return (
        <ErrorBoundary>
            <AppContent user={mockUser} logout={mockLogout} />
        </ErrorBoundary>
    );
};

export default App;