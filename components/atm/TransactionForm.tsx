import React, { useState, useEffect } from 'react';
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

export const TransactionForm: React.FC<TransactionFormProps> = (props) => {
    const { isOpen, onClose, activeLedger, editingTransaction, addTransaction, updateTransaction, transactionTypes, transactionRules } = props;
    
    const [formData, setFormData] = useState({
        typeId: '',
        amount: 0,
        notes: '',
        sourceAccount: 'bri' as keyof Balance,
        destinationAccount: 'cash' as keyof Balance,
        profitDestination: 'cash' as keyof Balance,
    });
    const [bankAdmin, setBankAdmin] = useState<number>(0);
    const [agentAdmin, setAgentAdmin] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    
    const isEditMode = !!editingTransaction;

    useEffect(() => {
        if (isEditMode) {
            setFormData({
                typeId: editingTransaction.typeId,
                amount: editingTransaction.amount,
                notes: editingTransaction.notes,
                sourceAccount: editingTransaction.sourceAccount,
                destinationAccount: editingTransaction.destinationAccount,
                profitDestination: editingTransaction.profitDestination,
            });
        } else {
             setFormData({ typeId: '', amount: 0, notes: '', sourceAccount: 'bri', destinationAccount: 'cash', profitDestination: 'cash' });
        }
    }, [editingTransaction, isOpen]);

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
            // If editing, keep original admin values if no rule matches
            if (isEditMode && editingTransaction.typeId === typeId && editingTransaction.amount === amount) {
                setBankAdmin(editingTransaction.bankAdmin);
                setAgentAdmin(editingTransaction.agentAdmin);
            } else {
                setBankAdmin(0);
                setAgentAdmin(0);
            }
        }
    }, [formData.typeId, formData.amount, transactionRules, isEditMode, editingTransaction]);
    
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
        const selectedType = transactionTypes.find(t => t.id === formData.typeId);
        if (!selectedType) {
            alert("Jenis transaksi tidak valid.");
            setLoading(false);
            return;
        }

        try {
            if (isEditMode) {
                 await updateTransaction(activeLedger.id, editingTransaction.id, {
                     ...formData,
                     typeName: selectedType.name,
                     bankAdmin,
                     agentAdmin,
                 });
            } else {
                await addTransaction(activeLedger.id, {
                    ...formData,
                    typeName: selectedType.name,
                    bankAdmin,
                    agentAdmin,
                });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save transaction:", error);
            alert("Gagal menyimpan transaksi.");
        } finally {
            setLoading(false);
        }
    };
    
    const selectedTypeFlow = transactionTypes.find(t => t.id === formData.typeId)?.flow;

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

                {selectedTypeFlow && (
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium">{selectedTypeFlow === 'CASH_IN' ? 'Sumber Dana (Dari)' : 'Dana Masuk (Ke)'}</label>
                            <select name={selectedTypeFlow === 'CASH_IN' ? 'sourceAccount' : 'destinationAccount'} value={selectedTypeFlow === 'CASH_IN' ? formData.sourceAccount : formData.destinationAccount} onChange={handleChange} required className="w-full px-3 py-2 bg-gray-100 dark:bg-navy-800 border rounded-lg">
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