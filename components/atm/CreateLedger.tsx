import React, { useState, useEffect } from 'react';
import type { Balance } from '../../types';
import { formatCurrency, formatNumberWithSeparators, parseFormattedNumber } from '../../utils/helpers';
import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CreateLedgerProps {
  createLedger: (name: string, initialBalance: Balance) => Promise<void>;
  onCancel?: () => void; // Made optional for edit mode
  initialData?: Balance;
  isEditMode?: boolean;
}

const balanceKeys: (keyof Balance)[] = ['bri', 'mandiri', 'dana', 'savePlus', 'cash'];
const balanceLabels: Record<keyof Balance, string> = {
  bri: 'Saldo BRI',
  mandiri: 'Saldo Mandiri',
  dana: 'Saldo DANA',
  savePlus: 'Saldo SavePlus',
  cash: 'Uang Tunai (CASH)',
};

export const CreateLedger: React.FC<CreateLedgerProps> = ({ createLedger, onCancel, initialData, isEditMode = false }) => {
  const [name, setName] = useState('');
  const [balances, setBalances] = useState<Balance>(initialData || { bri: 0, mandiri: 0, dana: 0, savePlus: 0, cash: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEditMode) {
      setName(`Pembukuan ${format(new Date(), 'yyyy-MM-dd')}`);
    }
  }, [isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Fix: Cast name to keyof Balance to maintain type safety of the state object.
    setBalances(prev => ({ ...prev, [name as keyof Balance]: parseFormattedNumber(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await createLedger(name, balances);
    // Loading state will be handled by parent component
  };

  // Fix: Explicitly type accumulator and value in reduce to prevent type inference errors with Object.values.
  const totalBalance = Object.values(balances).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);

  return (
    <div className={`flex flex-col items-center justify-center text-center ${!isEditMode ? 'p-8 animate-fade-in' : ''}`}>
        <div className={`w-full max-w-lg ${!isEditMode ? 'bg-light-card dark:bg-dark-card p-8 rounded-xl shadow-2xl border border-white/10' : ''}`}>
            {!isEditMode && (
              <>
                <PlusCircle size={64} className="mx-auto text-gold-500 mb-4" />
                <h2 className="text-3xl font-bold text-navy-800 dark:text-gold-400 mb-2">Buat Pembukuan Baru</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Catat saldo awal Anda untuk memulai sesi pembukuan baru.</p>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {!isEditMode && (
                   <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Sesi Pembukuan</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border border-gray-300 dark:border-navy-700 rounded-lg"
                            required
                        />
                    </div>
                )}
                {balanceKeys.map(key => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{balanceLabels[key]}</label>
                        <input
                            type="text"
                            name={key}
                            value={formatNumberWithSeparators(balances[key])}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border border-gray-300 dark:border-navy-700 rounded-lg"
                            placeholder="0"
                        />
                    </div>
                ))}

                <div className="pt-4 border-t border-gray-200 dark:border-navy-700">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Total Saldo</span>
                        <span className="font-bold text-lg text-gold-500">{formatCurrency(totalBalance)}</span>
                    </div>
                </div>
                
                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                     <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 font-bold rounded-lg shadow-lg hover:shadow-soft-glow transition-all duration-300 transform hover:scale-105 disabled:opacity-50">
                        {loading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan Saldo' : 'Mulai Sesi Transaksi')}
                    </button>
                    {!isEditMode && onCancel && (
                        <button type="button" onClick={onCancel} className="w-full sm:w-auto px-6 py-3 bg-gray-200 dark:bg-navy-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-navy-600 transition-colors">
                            Batal
                        </button>
                    )}
                </div>
            </form>
        </div>
    </div>
  );
};