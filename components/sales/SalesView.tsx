
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react';
import type { Provider, Voucher } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface SalesViewProps {
  providers: Provider[];
  vouchers: Voucher[];
  onBack: () => void;
  onCompleteSale: (cart: Record<string, number>) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ providers, vouchers, onBack, onCompleteSale }) => {
  const [cart, setCart] = useState<Record<string, number>>({});

  const handleQuantityChange = (voucherId: string, delta: number, stock: number) => {
    setCart(prev => {
      const currentQty = prev[voucherId] || 0;
      const newQty = Math.max(0, Math.min(stock, currentQty + delta));
      if (newQty > 0) {
        return { ...prev, [voucherId]: newQty };
      } else {
        const newCart = { ...prev };
        delete newCart[voucherId];
        return newCart;
      }
    });
  };

  const vouchersById = useMemo(() => 
    vouchers.reduce((acc, v) => {
      acc[v.id] = v;
      return acc;
    }, {} as Record<string, Voucher>), 
  [vouchers]);
  
  const cartItems = Object.entries(cart);
  
  const totalSale = useMemo(() => 
    cartItems.reduce((total, [voucherId, qty]) => {
      const voucher = vouchersById[voucherId];
      return total + (voucher ? voucher.sellPrice * Number(qty) : 0);
    }, 0),
  [cart, vouchersById]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors">
          <ArrowLeft size={24} className="text-navy-800 dark:text-gold-400" />
        </button>
        <h2 className="text-3xl font-bold text-navy-800 dark:text-gold-400">Kasir Penjualan</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {providers.map(provider => {
            const providerVouchers = vouchers.filter(v => v.providerId === provider.id);
            if (providerVouchers.length === 0) return null;
            return (
              <div key={provider.id} className="bg-light-card dark:bg-dark-card p-4 md:p-6 rounded-xl shadow-lg border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  {provider.logoUrl && <img src={provider.logoUrl} alt={provider.name} className="h-8 w-8 object-contain" />}
                  <h3 className="text-xl font-bold text-navy-800 dark:text-gold-400">{provider.name}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {providerVouchers.map(v => (
                    <div key={v.id} className={`p-3 bg-gray-50 dark:bg-navy-800 rounded-lg ${v.remainingStock === 0 ? 'opacity-50' : ''}`}>
                      <p className="font-semibold text-gray-800 dark:text-white">{v.name}</p>
                      <p className="text-sm text-gold-500">{formatCurrency(v.sellPrice)}</p>
                      <p className={`text-xs ${v.remainingStock <= 2 ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>Stok: {v.remainingStock}</p>
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button disabled={v.remainingStock === 0} onClick={() => handleQuantityChange(v.id, -1, v.remainingStock)} className="p-1.5 bg-red-500/20 text-red-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"><Minus size={16} /></button>
                        <span className="w-8 text-center font-bold">{cart[v.id] || 0}</span>
                        <button disabled={v.remainingStock === 0} onClick={() => handleQuantityChange(v.id, 1, v.remainingStock)} className="p-1.5 bg-green-500/20 text-green-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-light-card dark:bg-dark-card p-4 md:p-6 rounded-xl shadow-lg border border-white/10">
            <h3 className="text-xl font-bold text-navy-800 dark:text-gold-400 mb-4 flex items-center gap-2"><ShoppingCart size={22}/> Keranjang</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {cartItems.length > 0 ? cartItems.map(([voucherId, qty]) => {
                const voucher = vouchersById[voucherId];
                if (!voucher) return null;
                return (
                  <div key={voucherId} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-semibold">{voucher.name}</p>
                      <p className="text-xs text-gray-500">{qty} x {formatCurrency(voucher.sellPrice)}</p>
                    </div>
                    <p className="font-bold">{formatCurrency(Number(qty) * voucher.sellPrice)}</p>
                  </div>
                );
              }) : <p className="text-sm text-gray-500">Keranjang masih kosong.</p>}
            </div>
            <div className="border-t border-gray-200 dark:border-navy-700 my-4"></div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(totalSale)}</span>
            </div>
            <button 
              onClick={() => onCompleteSale(cart)}
              disabled={cartItems.length === 0}
              className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 font-bold rounded-lg shadow-lg hover:shadow-soft-glow transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              Selesaikan Penjualan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
