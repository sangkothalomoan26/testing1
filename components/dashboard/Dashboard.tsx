
import React from 'react';
import type { Provider, Voucher } from '../../types';
// Fix: Import recharts library to resolve 'Recharts' not found error.
import * as Chart from 'recharts';
// Fix: Import icons from lucide-react to fix 'LucideReact' not existing on window.
import { Wifi, Upload, PlusCircle, ShoppingCart } from 'lucide-react';

interface DashboardProps {
  providers: Provider[];
  vouchers: Voucher[];
  onSelectProvider: (id: string) => void;
  onUploadClick: () => void;
  onAddProviderClick: () => void;
  onGoToSales: () => void;
}

// const Chart = window.Recharts; // This is now handled by the import

export const Dashboard: React.FC<DashboardProps> = ({ providers, vouchers, onSelectProvider, onUploadClick, onAddProviderClick, onGoToSales }) => {

  const chartData = providers.map(p => {
    const providerVouchers = vouchers.filter(v => v.providerId === p.id);
    const totalModal = providerVouchers.reduce((acc, v) => acc + v.totalStock * v.costPrice, 0);
    const totalPenjualan = providerVouchers.reduce((acc, v) => acc + (v.totalStock - v.remainingStock) * v.sellPrice, 0);
    const totalModalTerjual = providerVouchers.reduce((acc, v) => acc + (v.totalStock - v.remainingStock) * v.costPrice, 0);
    const totalProfit = totalPenjualan - totalModalTerjual;

    return {
      name: p.name,
      totalModal,
      totalPenjualan,
      totalProfit
    };
  });

  return (
    <div className="space-y-8">
      <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-lg border border-white/10">
        <h2 className="text-2xl font-bold mb-4 text-navy-800 dark:text-gold-400">Pilih Provider</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {providers.map(provider => {
            const providerVouchers = vouchers.filter(v => v.providerId === provider.id);
            const voucherCount = providerVouchers.length;
            const voucherText = voucherCount === 1 ? 'voucher' : 'vouchers';
            const totalRemainingStock = providerVouchers.reduce((acc, v) => acc + v.remainingStock, 0);
            const totalSoldStock = providerVouchers.reduce((acc, v) => acc + (v.totalStock - v.remainingStock), 0);

            return (
              <button
                key={provider.id}
                onClick={() => onSelectProvider(provider.id)}
                className="p-3 bg-gradient-to-br from-navy-700 to-navy-800 text-white rounded-lg shadow-md hover:shadow-gold-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-1 aspect-square group"
              >
                <div className="w-10 h-10 flex items-center justify-center mb-1">
                  {provider.logoUrl ? (
                    <img src={provider.logoUrl} alt={provider.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"/>
                  ) : (
                    <Wifi size={32} />
                  )}
                </div>
                <span className="font-semibold text-center leading-tight text-sm">{provider.name}</span>
                <span className="text-xs text-gold-400 opacity-80">{voucherCount} {voucherText}</span>
                <span className="text-[10px] text-gray-300 opacity-90 leading-tight">(Sisa: {totalRemainingStock} | Terjual: {totalSoldStock})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-lg border border-white/10">
          <h2 className="text-2xl font-bold mb-4 text-navy-800 dark:text-gold-400">Aksi Cepat</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={onUploadClick}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 font-bold rounded-lg shadow-lg hover:shadow-soft-glow transition-all duration-300 transform hover:scale-105"
            >
              {/* Fix: Use imported Upload component */}
              <Upload size={20} />
              Upload Excel
            </button>
            <button
              onClick={onAddProviderClick}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-navy-700 to-navy-800 text-white font-bold rounded-lg shadow-lg hover:shadow-soft-glow transition-all duration-300 transform hover:scale-105"
            >
              {/* Fix: Use imported PlusCircle component */}
              <PlusCircle size={20} />
              Tambah Provider
            </button>
             <button
              onClick={onGoToSales}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-soft-glow transition-all duration-300 transform hover:scale-105"
            >
              <ShoppingCart size={20} />
              Jual / Kasir
            </button>
          </div>
        </div>

        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-lg border border-white/10">
          <h2 className="text-2xl font-bold mb-4 text-navy-800 dark:text-gold-400">Ringkasan Keuangan</h2>
          <div className="w-full h-64">
            <Chart.ResponsiveContainer width="100%" height="100%">
              <Chart.BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <Chart.CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <Chart.XAxis dataKey="name" stroke="rgba(150,150,150,1)" fontSize={12} />
                <Chart.YAxis stroke="rgba(150,150,150,1)" fontSize={12} />
                <Chart.Tooltip
                  contentStyle={{
                    backgroundColor: '#172A45',
                    border: '1px solid #FFD700',
                    color: '#FFFFFF'
                  }}
                  formatter={(value) => new Intl.NumberFormat('id-ID').format(value)}
                />
                <Chart.Legend />
                <Chart.Bar dataKey="totalPenjualan" fill="#FFD700" name="Penjualan" />
                <Chart.Bar dataKey="totalProfit" fill="#4ade80" name="Profit" />
              </Chart.BarChart>
            </Chart.ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
