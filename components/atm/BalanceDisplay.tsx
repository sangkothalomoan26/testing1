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
  // Fix: Add Number() to ensure values are treated as numbers and explicitly type accumulator `sum` to fix reduce type inference.
  const totalBalance = Object.values(balance || {}).reduce((sum: number, val) => sum + Number(val), 0);

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {balanceConfig.map(({ key, label, icon }) => (
          <div key={key} className="bg-gray-50 dark:bg-navy-800 p-4 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
                {icon}
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">{label}</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(balance[key])}</p>
          </div>
        ))}
         <div className="bg-gold-500/10 dark:bg-gold-500/20 p-4 rounded-lg text-center col-span-2 md:col-span-3 lg:col-span-1 flex flex-col justify-center">
            <div className="flex items-center justify-center gap-2 mb-1">
                <CircleDollarSign size={24} className="text-gold-500" />
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gold-400">TOTAL</h3>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gold-400">{formatCurrency(totalBalance)}</p>
          </div>
      </div>
    </div>
  );
};