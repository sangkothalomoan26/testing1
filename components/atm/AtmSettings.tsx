import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { TransactionRule, TransactionType } from '../../types';
import { Plus, Trash2, Edit } from 'lucide-react';
import { formatNumberWithSeparators, parseFormattedNumber, formatCurrency } from '../../utils/helpers';

interface AtmSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  transactionTypes: TransactionType[];
  transactionRules: TransactionRule[];
  saveTransactionType: (type: Omit<TransactionType, 'id'>) => Promise<void>;
  deleteTransactionType: (id: string) => Promise<void>;
  saveTransactionRule: (rule: Omit<TransactionRule, 'id'>) => Promise<void>;
  updateTransactionRule: (id: string, rule: Partial<Omit<TransactionRule, 'id'>>) => Promise<void>;
  deleteTransactionRule: (id: string) => Promise<void>;
}

const ruleFormDefault = {
    id: '',
    transactionTypeId: '',
    minAmount: 0,
    maxAmount: 0,
    bankAdmin: 0,
    agentAdmin: 0,
};

export const AtmSettings: React.FC<AtmSettingsProps> = (props) => {
    const { isOpen, onClose, transactionTypes, transactionRules } = props;
    
    // State for new type form
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeFlow, setNewTypeFlow] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_IN');
    
    // State for new/edit rule form
    const [ruleFormData, setRuleFormData] = useState<Omit<TransactionRule, 'transactionTypeId'> & {id: string, transactionTypeId: string}>(ruleFormDefault);
    const isEditingRule = !!ruleFormData.id;

    const handleAddType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTypeName) return;
        await props.saveTransactionType({ name: newTypeName, flow: newTypeFlow });
        setNewTypeName('');
    };

    const handleRuleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['minAmount', 'maxAmount', 'bankAdmin', 'agentAdmin'].includes(name);
        setRuleFormData(prev => ({ ...prev, [name]: isNumeric ? parseFormattedNumber(value) : value }));
    }
    
    const handleRuleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ruleFormData.transactionTypeId) return;
        const { id, ...data } = ruleFormData;
        if (isEditingRule) {
            await props.updateTransactionRule(id, data);
        } else {
            await props.saveTransactionRule(data);
        }
        setRuleFormData(ruleFormDefault); // Reset form
    }

    const handleEditRule = (rule: TransactionRule) => {
        setRuleFormData({
           id: rule.id,
           transactionTypeId: rule.transactionTypeId,
           minAmount: rule.minAmount,
           maxAmount: rule.maxAmount,
           bankAdmin: rule.bankAdmin,
           agentAdmin: rule.agentAdmin,
        });
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pengaturan Mini ATM">
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* Section: Manage Transaction Types */}
                <div className="p-4 bg-gray-50 dark:bg-navy-800 rounded-lg">
                    <h3 className="font-bold mb-2">Kelola Jenis Transaksi</h3>
                    <div className="space-y-2 mb-4">
                        {transactionTypes.map(type => (
                            <div key={type.id} className="flex justify-between items-center p-2 bg-white dark:bg-navy-700 rounded">
                                <span>{type.name} <span className="text-xs text-gray-500">({type.flow === 'CASH_IN' ? 'Kas Masuk' : 'Kas Keluar'})</span></span>
                                <button onClick={() => props.deleteTransactionType(type.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleAddType} className="flex gap-2 items-end p-2 border-t border-gray-200 dark:border-navy-700/50">
                        <div className="flex-grow">
                            <label className="text-xs font-semibold" htmlFor="newTypeName">Nama Jenis Baru</label>
                            <input id="newTypeName" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="e.g., Tarik Tunai BRI" className="w-full px-2 py-1 bg-white dark:bg-navy-900 border rounded"/>
                        </div>
                        <div>
                             <label className="text-xs font-semibold" htmlFor="newTypeFlow">Alur Dana</label>
                             <select id="newTypeFlow" value={newTypeFlow} onChange={e => setNewTypeFlow(e.target.value as any)} className="w-full px-2 py-1 bg-white dark:bg-navy-900 border rounded">
                                 <option value="CASH_IN">Kas Masuk (Transfer, Bayar)</option>
                                 <option value="CASH_OUT">Kas Keluar (Tarik Tunai)</option>
                             </select>
                        </div>
                        <button type="submit" className="p-2 bg-gold-500 text-navy-900 rounded self-end"><Plus size={20}/></button>
                    </form>
                </div>
                
                {/* Section: Manage Transaction Rules */}
                <div className="p-4 bg-gray-50 dark:bg-navy-800 rounded-lg">
                     <h3 className="font-bold mb-2">Kelola Aturan Biaya Admin</h3>
                     <div className="space-y-2 mb-4">
                        {transactionRules.map(rule => {
                            const type = transactionTypes.find(t => t.id === rule.transactionTypeId);
                            return (
                                <div key={rule.id} className="flex justify-between items-center p-2 bg-white dark:bg-navy-700 rounded text-xs">
                                    <div className="flex-1">
                                        <p className="font-bold">{type?.name || 'N/A'}</p>
                                        <p>Range: {formatCurrency(rule.minAmount)} - {formatCurrency(rule.maxAmount)}</p>
                                        <p>Biaya: Bank {formatCurrency(rule.bankAdmin)} | Agen {formatCurrency(rule.agentAdmin)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditRule(rule)} className="text-blue-500 hover:text-blue-700"><Edit size={16}/></button>
                                        <button onClick={() => props.deleteTransactionRule(rule.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            );
                        })}
                     </div>
                     <form onSubmit={handleRuleSubmit} className="space-y-3 p-2 border-t border-gray-200 dark:border-navy-700/50">
                        <h4 className="font-semibold text-sm">{isEditingRule ? 'Edit Aturan' : 'Tambah Aturan Baru'}</h4>
                        <div>
                            <label className="text-xs" htmlFor="ruleTypeId">Jenis Transaksi</label>
                            <select id="ruleTypeId" name="transactionTypeId" value={ruleFormData.transactionTypeId} onChange={handleRuleFormChange} required className="w-full px-2 py-1 bg-white dark:bg-navy-900 border rounded">
                                <option value="" disabled>Pilih Jenis Transaksi...</option>
                                {transactionTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                               <label className="text-xs" htmlFor="ruleMinAmount">Min Nominal</label>
                               <input id="ruleMinAmount" name="minAmount" value={formatNumberWithSeparators(ruleFormData.minAmount)} onChange={handleRuleFormChange} placeholder="Min Nominal" className="w-full px-2 py-1 bg-white dark:bg-navy-900 border rounded"/>
                            </div>
                            <div>
                                <label className="text-xs" htmlFor="ruleMaxAmount">Max Nominal</label>
                                <input id="ruleMaxAmount" name="maxAmount" value={formatNumberWithSeparators(ruleFormData.maxAmount)} onChange={handleRuleFormChange} placeholder="Max Nominal" className="w-full px-2 py-1 bg-white dark:bg-navy-900 border rounded"/>
                            </div>
                            <div>
                               <label className="text-xs" htmlFor="ruleBankAdmin">Admin Bank</label>
                               <input id="ruleBankAdmin" name="bankAdmin" value={formatNumberWithSeparators(ruleFormData.bankAdmin)} onChange={handleRuleFormChange} placeholder="Admin Bank" className="w-full px-2 py-1 bg-white dark:bg-navy-900 border rounded"/>
                            </div>
                           <div>
                                <label className="text-xs" htmlFor="ruleAgentAdmin">Admin Agen</label>
                                <input id="ruleAgentAdmin" name="agentAdmin" value={formatNumberWithSeparators(ruleFormData.agentAdmin)} onChange={handleRuleFormChange} placeholder="Admin Agen" className="w-full px-2 py-1 bg-white dark:bg-navy-900 border rounded"/>
                           </div>
                        </div>
                         <button type="submit" className="w-full p-2 bg-gold-500 text-navy-900 rounded font-semibold">{isEditingRule ? 'Simpan Perubahan' : 'Tambah Aturan'}</button>
                         {isEditingRule && <button type="button" onClick={() => setRuleFormData(ruleFormDefault)} className="w-full p-1 text-xs text-center text-gray-500 hover:underline">Batal Edit</button>}
                     </form>
                </div>
            </div>
        </Modal>
    );
};