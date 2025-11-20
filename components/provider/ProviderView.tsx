
import React, { useState, useMemo } from 'react';
// Fix: Import icons from lucide-react to fix 'LucideReact' not existing on window.
import { ArrowLeft, ChevronsUpDown, ChevronUp, ChevronDown, Search, Edit, Trash2, PlusCircle } from 'lucide-react';
import type { Provider, Voucher } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface ProviderViewProps {
  provider: Provider;
  vouchers: Voucher[];
  onBack: () => void;
  onAddVoucher: (providerId: string) => void;
  onEditVoucher: (voucher: Voucher) => void;
  onDeleteVoucher: (voucher: Voucher) => void;
  onDeleteProvider: (provider: Provider) => void;
  onAddStock: (voucher: Voucher) => void;
}

export const ProviderView: React.FC<ProviderViewProps> = ({ 
  provider, 
  vouchers, 
  onBack, 
  onAddVoucher, 
  onEditVoucher,
  onDeleteVoucher,
  onDeleteProvider,
  onAddStock
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Voucher, direction: 'asc' | 'desc' } | null>(null);

  const sortedVouchers = useMemo(() => {
    let sortableItems = [...vouchers].filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [vouchers, searchTerm, sortConfig]);

  const requestSort = (key: keyof Voucher) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof Voucher) => {
    if (!sortConfig || sortConfig.key !== key) {
      // Fix: Use imported ChevronsUpDown component
      return <ChevronsUpDown size={16} className="ml-2 opacity-30" />;
    }
    // Fix: Use imported ChevronUp and ChevronDown components
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />;
  }

  const columns: { label: string; key: keyof Voucher, className?: string }[] = [
      { label: 'Nama Voucher', key: 'name', className: 'w-2/12' },
      { label: 'Total Stok', key: 'totalStock' },
      { label: 'Sisa Stok', key: 'remainingStock' },
      { label: 'Harga Modal', key: 'costPrice' },
      { label: 'Harga Jual', key: 'sellPrice' },
      { label: 'Rencana Tambah', key: 'plannedStock' },
  ];

  return (
    <div className="bg-light-card dark:bg-dark-card p-4 md:p-6 rounded-xl shadow-lg border border-white/10 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors">
            {/* Fix: Use imported ArrowLeft component */}
            <ArrowLeft size={24} className="text-navy-800 dark:text-gold-400" />
          </button>
          <div className="flex items-center gap-3">
             {provider.logoUrl && (
              <img src={provider.logoUrl} alt={`${provider.name} logo`} className="h-10 w-10 object-contain" />
            )}
            <h2 className="text-3xl font-bold text-navy-800 dark:text-gold-400">{provider.name}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => onDeleteProvider(provider)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 hover:shadow-soft-glow-red transition-all">Hapus Provider</button>
            <button onClick={() => onAddVoucher(provider.id)} className="px-4 py-2 bg-gold-500 text-navy-900 font-bold rounded-lg shadow-md hover:bg-gold-600 hover:shadow-soft-glow transition-all">Tambah Voucher</button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
            {/* Fix: Use imported Search component */}
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                placeholder="Cari voucher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-navy-800 border border-gray-300 dark:border-navy-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-gray-900 dark:text-white"
            />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-navy-700 dark:text-gray-300">
            <tr>
              {columns.map(col => (
                <th key={col.key} scope="col" className={`px-6 py-3 ${col.className || ''}`}>
                  <div className="flex items-center cursor-pointer" onClick={() => requestSort(col.key)}>
                    {col.label}
                    {getSortIcon(col.key)}
                  </div>
                </th>
              ))}
              <th scope="col" className="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedVouchers.map(v => {
              const sold = v.totalStock - v.remainingStock;
              const totalSales = sold * v.sellPrice;
              const profit = totalSales - (sold * v.costPrice);
              const totalModal = v.totalStock * v.costPrice;
              const lowStock = v.remainingStock <= 2;
              
              return (
              <tr key={v.id} className="bg-white dark:bg-dark-card border-b dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-800/50">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{v.name}</td>
                <td className="px-6 py-4">{v.totalStock}</td>
                <td className="px-6 py-4">
                    <span className={`font-bold ${lowStock ? 'text-red-500' : ''}`}>{v.remainingStock}</span>
                    {lowStock && <span className="ml-2 text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">Menipis</span>}
                </td>
                <td className="px-6 py-4">{formatCurrency(v.costPrice)}</td>
                <td className="px-6 py-4">{formatCurrency(v.sellPrice)}</td>
                <td className="px-6 py-4">{v.plannedStock > 0 ? v.plannedStock : '-'}</td>
                <td className="px-6 py-4 flex items-center gap-2">
                   <button onClick={() => onAddStock(v)} className="p-1.5 text-green-500 hover:text-green-700 dark:hover:text-green-400"><PlusCircle size={18}/></button>
                  {/* Fix: Use imported Edit component */}
                  <button onClick={() => onEditVoucher(v)} className="p-1.5 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"><Edit size={18}/></button>
                  {/* Fix: Use imported Trash2 component */}
                  <button onClick={() => onDeleteVoucher(v)} className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400"><Trash2 size={18}/></button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
       {sortedVouchers.length === 0 && <p className="text-center py-8 text-gray-500">Tidak ada data voucher.</p>}
    </div>
  );
};
