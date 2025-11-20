
import { useState, useEffect, useCallback } from 'react';
import { firestore } from '../firebase/config';
import type { AtmLedger, AtmTransaction, Balance, TransactionRule, TransactionType } from '../types';

export const useAtmStore = (userId: string) => {
    const [ledgers, setLedgers] = useState<AtmLedger[]>([]);
    const [transactions, setTransactions] = useState<AtmTransaction[]>([]);
    const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
    const [transactionRules, setTransactionRules] = useState<TransactionRule[]>([]);
    const [loading, setLoading] = useState(true);

    const userDocRef = useCallback(() => firestore.collection('users').doc(userId), [userId]);

    const recalculateLedgerBalance = useCallback(async (ledgerId: string) => {
        const ledgerRef = userDocRef().collection('atmLedgers').doc(ledgerId);
        const ledgerSnap = await ledgerRef.get();
        if (!ledgerSnap.exists) return;

        const ledgerData = ledgerSnap.data() as Omit<AtmLedger, 'id'>;
        let newBalance = { ...ledgerData.initialBalance };

        const transactionsSnap = await userDocRef().collection('atmTransactions').where('ledgerId', '==', ledgerId).get();
        const ledgerTransactions = transactionsSnap.docs.map(doc => doc.data() as AtmTransaction);

        for (const tx of ledgerTransactions) {
            newBalance[tx.sourceAccount] = (Number(newBalance[tx.sourceAccount]) || 0) - (Number(tx.amount) || 0);
            newBalance[tx.destinationAccount] = (Number(newBalance[tx.destinationAccount]) || 0) + (Number(tx.amount) || 0);
            newBalance[tx.profitDestination] = (Number(newBalance[tx.profitDestination]) || 0) + (Number(tx.agentAdmin) || 0);
        }

        await ledgerRef.update({ currentBalance: newBalance });
    }, [userDocRef]);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const unsubscribe = userDocRef().collection('atmLedgers').orderBy('date', 'desc').onSnapshot(snapshot => {
            setLedgers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AtmLedger)));
            setLoading(false);
        }, error => {
            console.error("Error fetching ledgers:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userId, userDocRef]);

    const fetchTransactionsForLedger = useCallback((ledgerId: string) => {
        const query = userDocRef().collection('atmTransactions')
            .where('ledgerId', '==', ledgerId)
            .orderBy('timestamp', 'asc');

        return query.onSnapshot(snapshot => {
            const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AtmTransaction));
            setTransactions(transData);
        }, (error: any) => {
            console.error("Firebase Error:", error.message);
            if (error.code === 'failed-precondition') {
                const urlMatch = error.message.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch && urlMatch[0]) {
                    throw new Error(`MISSING_INDEX::${urlMatch[0]}`);
                }
            }
            throw error; // Re-throw other errors
        });
    }, [userDocRef]);
    
    const getTransactionsForLedger = useCallback(async (ledgerId: string): Promise<AtmTransaction[]> => {
        try {
            const snapshot = await userDocRef().collection('atmTransactions')
                .where('ledgerId', '==', ledgerId)
                .orderBy('timestamp', 'asc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AtmTransaction));
        } catch (error: any) {
             if (error.code === 'failed-precondition') {
                const urlMatch = error.message.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch && urlMatch[0]) {
                    throw new Error(`MISSING_INDEX::${urlMatch[0]}`);
                }
            }
            throw error;
        }
    }, [userDocRef]);

    useEffect(() => {
        if (!userId) return;
        const unsubTypes = userDocRef().collection('atmTransactionTypes').onSnapshot(snap => {
            setTransactionTypes(snap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionType)));
        });
        const unsubRules = userDocRef().collection('atmTransactionRules').onSnapshot(snap => {
            setTransactionRules(snap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionRule)));
        });
        return () => { unsubTypes(); unsubRules(); };
    }, [userId, userDocRef]);

    const createLedger = async (name: string, initialBalance: Balance) => {
        const newLedger: Omit<AtmLedger, 'id'> = {
            name,
            date: new Date().toISOString(),
            initialBalance,
            currentBalance: initialBalance,
        };
        await userDocRef().collection('atmLedgers').add(newLedger);
    };
    
    const deleteLedger = async (ledgerId: string) => {
        const batch = firestore.batch();
        batch.delete(userDocRef().collection('atmLedgers').doc(ledgerId));
        const transactionsSnapshot = await userDocRef().collection('atmTransactions').where('ledgerId', '==', ledgerId).get();
        transactionsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    };

    const addTransaction = async (ledgerId: string, transaction: Omit<AtmTransaction, 'id' | 'ledgerId' | 'timestamp'>) => {
        await userDocRef().collection('atmTransactions').add({
            ...transaction,
            ledgerId,
            timestamp: new Date().toISOString(),
        });
        await recalculateLedgerBalance(ledgerId);
    };

    const updateTransaction = async (ledgerId: string, transactionId: string, updatedData: Partial<AtmTransaction>) => {
        await userDocRef().collection('atmTransactions').doc(transactionId).update(updatedData);
        await recalculateLedgerBalance(ledgerId);
    };

    const deleteTransaction = async (ledgerId: string, transactionId: string) => {
        await userDocRef().collection('atmTransactions').doc(transactionId).delete();
        await recalculateLedgerBalance(ledgerId);
    };

    const updateInitialBalance = async (ledgerId: string, newInitialBalance: Balance) => {
        await userDocRef().collection('atmLedgers').doc(ledgerId).update({ initialBalance: newInitialBalance });
        await recalculateLedgerBalance(ledgerId);
    };

    const saveTransactionType = async (type: Omit<TransactionType, 'id'>) => { await userDocRef().collection('atmTransactionTypes').add(type); }
    const deleteTransactionType = async (id: string) => {
        const rulesSnapshot = await userDocRef().collection('atmTransactionRules').where('transactionTypeId', '==', id).get();
        const batch = firestore.batch();
        rulesSnapshot.forEach(doc => batch.delete(doc.ref));
        batch.delete(userDocRef().collection('atmTransactionTypes').doc(id));
        await batch.commit();
    }
    const saveTransactionRule = async (rule: Omit<TransactionRule, 'id'>) => { await userDocRef().collection('atmTransactionRules').add(rule); }
    const updateTransactionRule = async (id: string, rule: Partial<Omit<TransactionRule, 'id'>>) => { await userDocRef().collection('atmTransactionRules').doc(id).update(rule); }
    const deleteTransactionRule = async (id: string) => { await userDocRef().collection('atmTransactionRules').doc(id).delete(); }

    return {
        loading,
        ledgers,
        transactions,
        transactionTypes,
        transactionRules,
        createLedger,
        deleteLedger,
        fetchTransactionsForLedger,
        getTransactionsForLedger,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateInitialBalance,
        saveTransactionType,
        deleteTransactionType,
        saveTransactionRule,
        updateTransactionRule,
        deleteTransactionRule,
    };
};