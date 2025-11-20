import React from 'react';
import type { Balance } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { Landmark, Wallet, Smartphone, Shield, CircleDollarSign, Edit } from 'lucide-react';

interface BalanceDisplayProps {
  title: string;
  balance: Balance;
  onEdit?: () => void;
}

const balanceConfig: { key: keyof Balance, label: string, icon: React.ReactNode }[] = [
    { key: 'bri', label: 'BRI', icon: <Landmark size={24} className="text-blue-500" /> },
    { key: 'mandiri', label: 'Mandiri', icon: <Landmark size={24} className="text-yellow-500" /> },
    { key: 'dana', label: 'DANA', icon: <Smartphone size={24} className="text-blue-400" /> },
    { key: 'savePlus', label: 'SavePlus', icon: <Shield size={24} className="text-green-500" /> },
    { key: 'cash', label: 'Tunai', icon: <Wallet size={24} className="text-gray-500" /> },
];

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ title, balance, onEdit }) => {
  // Fix: Explicitly type accumulator and value in reduce to prevent type inference errors with Object.values.
  const totalBalance = Object.values(balance || {}).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);

  return (
    <div className="bg-light-card dark:bg-dark-card p-4 md:p-6 rounded-xl shadow-lg border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-navy-800 dark:text-gold-400">{title}</h2>
        {onEdit && (
          <button onClick={onEdit} className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-700 dark:hover:text-blue-400">
            <Edit size={16} /> Edit
          </button>
        )}
      </div>
      
      {/* Grid for individual balances */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {balanceConfig.map(({ key, label, icon }) => (
          <div key={key} className="bg-gray-50 dark:bg-navy-800 p-4 rounded-lg text-center transform hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-center gap-2 mb-1">
                {icon}
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">{label}</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(balance[key] || 0)}</p>
          </div>
        ))}
      </div>

      {/* Prominent Total Balance Card */}
      <div className="bg-gradient-to-br from-navy-800 to-navy-900 text-white p-6 rounded-xl shadow-2xl flex items-center justify-between">
          <div>
              <div className="flex items-center gap-3">
                  <CircleDollarSign size={32} className="text-gold-500"/>
                  <h3 className="text-2xl font-bold text-gold-400">TOTAL</h3>
              </div>
          </div>
          <p className="text-4xl font-bold text-white tracking-tight">{formatCurrency(totalBalance)}</p>
      </div>
    </div>
  );
};