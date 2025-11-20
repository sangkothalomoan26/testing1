
import React from 'react';

export type Theme = 'light' | 'dark';

export interface Provider {
  id: string; // Firestore document ID
  name: string;
  logoUrl?: string;
  originalId: number; // Keep original numeric ID for sorting/mapping from Excel
}

export interface Voucher {
  id: string; // Firestore document ID
  providerId: string; // Firestore Provider ID
  name: string;
  totalStock: number;
  remainingStock: number;
  costPrice: number;
  sellPrice: number;
  plannedStock: number;
}

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: React.ReactNode; // Changed from string to React.ReactNode
}

export interface ActivityLog {
  id: string; // Firestore document ID
  timestamp: string;
  type: 'SALE' | 'EDIT' | 'DELETE_VOUCHER' | 'DELETE_PROVIDER' | 'IMPORT' | 'ADD_STOCK';
  message: string;
}

// --- Mini ATM Types ---

export interface Balance {
  bri: number;
  mandiri: number;
  dana: number;
  savePlus: number;
  cash: number;
}

export interface AtmLedger {
  id: string; // Firestore document ID
  name: string; // User-defined name for the ledger
  date: string;
  initialBalance: Balance;
  currentBalance: Balance;
}

export interface AtmTransaction {
  id: string; // Firestore document ID
  ledgerId: string;
  timestamp: string;
  typeId: string;
  typeName: string;
  amount: number;
  bankAdmin: number;
  agentAdmin: number;
  notes: string;
  // These properties define how the transaction affects balances
  sourceAccount: keyof Balance;
  destinationAccount: keyof Balance;
  profitDestination: keyof Balance;
}

export interface TransactionType {
    id: string; // Firestore document ID
    name: string;
    // This defines the core logic of the transaction
    // 'CASH_OUT': Customer receives cash, your bank balance increases (e.g., Tarik Tunai)
    // 'CASH_IN': Customer gives cash, your bank balance decreases (e.g., Transfer, Bill Payment)
    flow: 'CASH_OUT' | 'CASH_IN';
}

export interface TransactionRule {
    id: string; // Firestore document ID
    transactionTypeId: string;
    minAmount: number;
    maxAmount: number;
    bankAdmin: number;
    agentAdmin: number;
}