
import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { AtmTransaction, TransactionRule, TransactionType, Balance, AtmLedger } from '../../types';
import { formatNumberWithSeparators, parseFormattedNumber, formatCurrency } from '../../utils/helpers';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  activeLedger: AtmLedger;
  editingTransaction: AtmTransaction | null;
  addTransaction: (ledgerId: string, transaction: Omit<AtmTransaction, 'id' | 'ledgerId' | 'timestamp'>) => Promise<void>;
  updateTransaction: (ledgerId: string, transactionId: string, updatedData: Partial<AtmTransaction>) => Promise<void>;
  transactionTypes: TransactionType[];
  transactionRules: TransactionRule[];
}

const balanceOptions: { key: keyof Balance, label: string }[] = [
    { key: 'bri', label: 'BRI' },
    { key: 'mandiri', label: 'Mandiri' },
    { key: 'dana', label: 'DANA' },
    { key: 'savePlus', label: 'SavePlus' },
    { key: 'cash', label: 'Tunai (CASH)' },
];

const initialFormData = {
    typeId: '',
    amount: 0,
    notes: '',
    sourceAccount: 'bri' as keyof Balance,
    destinationAccount: 'cash' as keyof Balance,
    profitDestination: 'cash' as keyof Balance,
};

export const TransactionForm: React.FC<TransactionFormProps> = (props) => {
    const { isOpen, onClose, activeLedger, editingTransaction, addTransaction, updateTransaction, transactionTypes, transactionRules } = props;
    
    const [formData, setFormData] = useState(initialFormData);
    const [bankAdmin, setBankAdmin] = useState<number>(0);
    const [agentAdmin, setAgentAdmin] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    
    const isEditMode = !!editingTransaction;

    const selectedType = useMemo(() => transactionTypes.find(t => t.id === formData.typeId), [formData.typeId, transactionTypes]);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && editingTransaction) {
                setFormData({
                    typeId: editingTransaction.typeId,
                    amount: editingTransaction.amount,
                    notes: editingTransaction.notes,
                    sourceAccount: editingTransaction.sourceAccount,
                    destinationAccount: editingTransaction.destinationAccount,
                    profitDestination: editingTransaction.profitDestination,
                });
                setBankAdmin(editingTransaction.bankAdmin);
                setAgentAdmin(editingTransaction.agentAdmin);
            } else {
                setFormData(initialFormData);
                setBankAdmin(0);
                setAgentAdmin(0);
            }
        }
    }, [editingTransaction, isOpen, isEditMode]);
    
    // Auto-calculate admin fees
    useEffect(() => {
        const { typeId, amount } = formData;
        if (!typeId || amount <= 0) {
            setBankAdmin(0);
            setAgentAdmin(0);
            return;
        }
        
        const applicableRule = transactionRules.find(r => 
            r.transactionTypeId === typeId && amount >= r.minAmount && amount <= r.maxAmount
        );

        if (applicableRule) {
            setBankAdmin(applicableRule.bankAdmin);
            setAgentAdmin(applicableRule.agentAdmin);
        } else {
             setBankAdmin(0);
             setAgentAdmin(0);
        }
    }, [formData.typeId, formData.amount, transactionRules]);
    
    // Auto-determine source/destination based on transaction flow
    useEffect(() => {
        if (selectedType) {
            if (selectedType.flow === 'CASH_OUT') { // Tarik Tunai
                setFormData(prev => ({ ...prev, sourceAccount: 'cash' }));
            } else { // Transfer, Bayar, dll.
                setFormData(prev => ({ ...prev, destinationAccount: 'cash' }));
            }
        }
    }, [selectedType]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFormattedNumber(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (!selectedType) {
            alert("Jenis transaksi tidak valid.");
            setLoading(false);
            return;
        }

        const finalTransactionData = {
            ...formData,
            typeName: selectedType.name,
            bankAdmin,
            agentAdmin,
        };

        try {
            if (isEditMode) {
                 await updateTransaction(activeLedger.id, editingTransaction.id, finalTransactionData);
            } else {
                await addTransaction(activeLedger.id, finalTransactionData);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save transaction:", error);
            alert("Gagal menyimpan transaksi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Jenis Transaksi</label>
                    <select name="typeId" value={formData.typeId} onChange={handleChange} required className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg">
                        <option value="" disabled>Pilih jenis transaksi...</option>
                        {transactionTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Nominal Transaksi</label>
                    <input name="amount" type="text" value={formatNumberWithSeparators(formData.amount)} onChange={handleChange} required className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg" />
                </div>

                {selectedType && (
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium">
                                {selectedType.flow === 'CASH_IN' ? 'Sumber Dana (Dari Rek.)' : 'Dana Masuk (Ke Rek.)'}
                            </label>
                            <select 
                                name={selectedType.flow === 'CASH_IN' ? 'sourceAccount' : 'destinationAccount'} 
                                value={selectedType.flow === 'CASH_IN' ? formData.sourceAccount : formData.destinationAccount} 
                                onChange={handleChange} 
                                required 
                                className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg"
                            >
                                {balanceOptions.filter(o => o.key !== 'cash').map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Keuntungan Masuk Ke</label>
                            <select name="profitDestination" value={formData.profitDestination} onChange={handleChange} required className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg">
                                {balanceOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                )}
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Admin Bank (Otomatis)</label>
                        <input type="text" value={formatCurrency(bankAdmin)} readOnly className="w-full px-3 py-2 bg-gray-200 dark:bg-navy-900 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Admin Agen (Otomatis)</label>
                        <input type="text" value={formatCurrency(agentAdmin)} readOnly className="w-full px-3 py-2 bg-gray-200 dark:bg-navy-900 border rounded-lg" />
                    </div>
                </div>
               
                <div>
                    <label className="block text-sm font-medium">Catatan (Opsional)</label>
                    <input name="notes" type="text" value={formData.notes} onChange={handleChange} className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg" />
                </div>
                <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={loading || !formData.typeId || formData.amount <= 0} className="px-6 py-2 bg-gold-500 text-navy-900 font-bold rounded-lg shadow-md hover:bg-gold-600 disabled:opacity-50">
                        {loading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Simpan Transaksi')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
