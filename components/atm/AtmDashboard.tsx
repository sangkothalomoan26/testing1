import React, { useState } from 'react';
import type { AtmLedger, AtmTransaction, Balance, TransactionRule, TransactionType } from '../../types';
import { BalanceDisplay } from './BalanceDisplay';
import { TransactionForm } from './TransactionForm';
import { AtmSettings } from './AtmSettings';
import { formatCurrency } from '../../utils/helpers';
import { Plus, Settings, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Modal } from '../common/Modal';
import { CreateLedger } from './CreateLedger'; // Used for editing initial balance

interface AtmDashboardProps {
  activeLedger: AtmLedger;
  transactions: AtmTransaction[];
  transactionTypes: TransactionType[];
  transactionRules: TransactionRule[];
  onBack: () => void;
  addTransaction: (ledgerId: string, transaction: Omit<AtmTransaction, 'id' | 'ledgerId' | 'timestamp'>) => Promise<void>;
  updateTransaction: (ledgerId: string, transactionId: string, updatedData: Partial<AtmTransaction>) => Promise<void>;
  deleteTransaction: (ledgerId: string, transactionId: string) => Promise<void>;
  updateInitialBalance: (ledgerId: string, newBalance: Balance) => Promise<void>;
  saveTransactionType: (type: Omit<TransactionType, 'id'>) => Promise<void>;
  deleteTransactionType: (id: string) => Promise<void>;
  saveTransactionRule: (rule: Omit<TransactionRule, 'id'>) => Promise<void>;
  updateTransactionRule: (id: string, rule: Partial<Omit<TransactionRule, 'id'>>) => Promise<void>;
  deleteTransactionRule: (id: string) => Promise<void>;
}

export const AtmDashboard: React.FC<AtmDashboardProps> = (props) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<AtmTransaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<AtmTransaction | null>(null);
  const [isEditInitialBalanceOpen, setIsEditInitialBalanceOpen] = useState(false);
  
  const { activeLedger, transactions, onBack } = props;

  const handleOpenEditTransaction = (tx: AtmTransaction) => {
    setEditingTransaction(tx);
    setIsTransactionFormOpen(true);
  }

  const handleCloseTransactionForm = () => {
    setIsTransactionFormOpen(false);
    setEditingTransaction(null);
  }
  
  const confirmDeleteTransaction = () => {
    if (deletingTransaction) {
        props.deleteTransaction(activeLedger.id, deletingTransaction.id);
        setDeletingTransaction(null);
    }
  }
  
  const handleUpdateInitialBalance = async (newBalance: Balance) => {
    await props.updateInitialBalance(activeLedger.id, newBalance);
    setIsEditInitialBalanceOpen(false);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors">
            <ArrowLeft size={24} className="text-navy-800 dark:text-gold-400" />
        </button>
        <h2 className="text-3xl font-bold text-navy-800 dark:text-gold-400">{activeLedger.name}</h2>
      </div>

      <BalanceDisplay title="Saldo Awal Sesi" balance={activeLedger.initialBalance} onEdit={() => setIsEditInitialBalanceOpen(true)} />

      <div className="bg-light-card dark:bg-dark-card p-4 md:p-6 rounded-xl shadow-lg border border-white/10">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-navy-800 dark:text-gold-400">Riwayat Transaksi</h2>
            <div className="flex items-center gap-2">
                 <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition-all">
                    <Settings size={16} /> Pengaturan
                </button>
                <button onClick={() => setIsTransactionFormOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-navy-900 font-bold rounded-lg shadow-md hover:bg-gold-600 hover:shadow-soft-glow transition-all">
                    <Plus size={18} /> Tambah Transaksi
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-navy-700 dark:text-gray-300">
              <tr>
                <th scope="col" className="px-6 py-3">Waktu</th>
                <th scope="col" className="px-6 py-3">Jenis Transaksi</th>
                <th scope="col" className="px-6 py-3">Nominal</th>
                <th scope="col" className="px-6 py-3">Admin</th>
                <th scope="col" className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="bg-white dark:bg-dark-card border-b dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-800/50">
                  <td className="px-6 py-4">{new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{tx.typeName}</td>
                  <td className="px-6 py-4">{formatCurrency(tx.amount)}</td>
                  <td className="px-6 py-4">{formatCurrency(tx.agentAdmin)}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <button onClick={() => handleOpenEditTransaction(tx)} className="p-1.5 text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                    <button onClick={() => setDeletingTransaction(tx)} className="p-1.5 text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           {transactions.length === 0 && <p className="text-center py-8 text-gray-500">Belum ada transaksi.</p>}
        </div>
      </div>
      
      <BalanceDisplay title="Ringkasan Saldo Akhir" balance={activeLedger.currentBalance} />
      
      {isSettingsOpen && (
        <AtmSettings 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          transactionTypes={props.transactionTypes}
          transactionRules={props.transactionRules}
          saveTransactionType={props.saveTransactionType}
          deleteTransactionType={props.deleteTransactionType}
          saveTransactionRule={props.saveTransactionRule}
          updateTransactionRule={props.updateTransactionRule}
          deleteTransactionRule={props.deleteTransactionRule}
        />
      )}

      {isTransactionFormOpen && (
        <TransactionForm
          isOpen={isTransactionFormOpen}
          onClose={handleCloseTransactionForm}
          activeLedger={activeLedger}
          editingTransaction={editingTransaction}
          addTransaction={props.addTransaction}
          updateTransaction={props.updateTransaction}
          transactionTypes={props.transactionTypes}
          transactionRules={props.transactionRules}
        />
      )}
      
      <Modal isOpen={!!deletingTransaction} onClose={() => setDeletingTransaction(null)} title="Konfirmasi Hapus">
          <p>Yakin ingin menghapus transaksi <strong>{deletingTransaction?.typeName}</strong> senilai <strong>{formatCurrency(deletingTransaction?.amount || 0)}</strong>?</p>
          <div className="mt-6 flex justify-end gap-4">
              <button onClick={() => setDeletingTransaction(null)} className="px-6 py-2 rounded-lg">Batal</button>
              <button onClick={confirmDeleteTransaction} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg">Hapus</button>
          </div>
      </Modal>

      {isEditInitialBalanceOpen && (
          <Modal isOpen={isEditInitialBalanceOpen} onClose={() => setIsEditInitialBalanceOpen(false)} title="Edit Saldo Awal">
              <CreateLedger 
                createLedger={handleUpdateInitialBalance} 
                initialData={activeLedger.initialBalance}
                isEditMode={true}
              />
          </Modal>
      )}

    </div>
  );
};