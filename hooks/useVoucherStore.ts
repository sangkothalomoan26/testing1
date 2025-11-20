



import { useState, useEffect, useCallback } from 'react';
import type { Provider, Voucher, ActivityLog } from '../types';

// Fix: Changed id to string and added originalId to match Provider type.
const defaultProviders: Provider[] = [
  { id: '1', name: 'Telkomsel', originalId: 1, logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Telkomsel_2021_icon.svg' },
  { id: '2', name: 'IM3', originalId: 2, logoUrl: 'https://im3-img.indosatooredoo.com/indosatassets/images/icons/icon-512x512.png' },
  { id: '3', name: 'Three', originalId: 3, logoUrl: 'https://iconape.com/wp-content/png_logo_vector/3-logo-2.png' },
  { id: '4', name: 'XL', originalId: 4, logoUrl: 'https://static.vecteezy.com/system/resources/previews/071/673/737/non_2x/xl-axiata-logo-glossy-square-xl-axiata-telecom-symbol-free-png.png' },
  { id: '5', name: 'Axis', originalId: 5, logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Axis_logo_2015.svg/1200px-Axis_logo_2015.svg.png' },
  { id: '6', name: 'Smartfren', originalId: 6, logoUrl: 'https://images.seeklogo.com/logo-png/20/2/smartfren-logo-png_seeklogo-202951.png' },
  { id: '7', name: 'By.U', originalId: 7, logoUrl: 'https://bigrit.com/wp-content/uploads/2020/11/byu.png' },
];

export const useVoucherStore = () => {
  const [providers, setProviders] = useState<Provider[]>(() => {
    try {
      const savedProviders = localStorage.getItem('voucherApp_providers');
      return savedProviders ? JSON.parse(savedProviders) : defaultProviders;
    } catch (error) {
      console.error("Failed to load providers from localStorage", error);
      return defaultProviders;
    }
  });

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    try {
      const savedVouchers = localStorage.getItem('voucherApp_vouchers');
      return savedVouchers ? JSON.parse(savedVouchers) : [];
    } catch (error) {
      console.error("Failed to load vouchers from localStorage", error);
      return [];
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const savedLogs = localStorage.getItem('voucherApp_activityLogs');
      return savedLogs ? JSON.parse(savedLogs) : [];
    } catch (error) {
      console.error("Failed to load activity logs from localStorage", error);
      return [];
    }
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('voucherApp_providers', JSON.stringify(providers));
    } catch (error) {
      console.error("Failed to save providers to localStorage", error);
    }
  }, [providers]);

  useEffect(() => {
    try {
      localStorage.setItem('voucherApp_vouchers', JSON.stringify(vouchers));
    } catch (error) {
      console.error("Failed to save vouchers to localStorage", error);
    }
  }, [vouchers]);

  useEffect(() => {
    try {
      localStorage.setItem('voucherApp_activityLogs', JSON.stringify(activityLogs));
    } catch (error) {
      console.error("Failed to save activity logs to localStorage", error);
    }
  }, [activityLogs]);

  const addLog = useCallback((type: ActivityLog['type'], message: string) => {
    const newLog: ActivityLog = {
        // Fix: Convert number to string to match ActivityLog type for 'id'.
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type,
        message,
    };
    setActivityLogs(prev => [newLog, ...prev]);
  }, []);

  const addProvider = useCallback((provider: Provider) => {
    setProviders(prev => {
      if (prev.find(p => p.id === provider.id)) return prev;
      // Fix: Sort by originalId which is a number.
      return [...prev, provider].sort((a, b) => a.originalId - b.originalId);
    });
  }, []);

  // Fix: The providerId should be a string to match the Provider type.
  const deleteProvider = useCallback((providerId: string) => {
    setProviders(prev => prev.filter(p => p.id !== providerId));
    setVouchers(prev => prev.filter(v => v.providerId !== providerId));
  }, []);
  
  const addVoucher = useCallback((voucher: Omit<Voucher, 'id'>) => {
    setVouchers(prev => {
      const id = `${voucher.providerId}-${voucher.name}`;
      const newVoucher: Voucher = { ...voucher, id };
      return [...prev, newVoucher];
    });
  }, []);

  const updateVoucher = useCallback((updatedVoucher: Voucher) => {
    setVouchers(prev => prev.map(v => v.id === updatedVoucher.id ? updatedVoucher : v));
  }, []);
  
  const upsertVoucher = useCallback((voucherData: Omit<Voucher, 'id'>) => {
    const id = `${voucherData.providerId}-${voucherData.name}`;
    setVouchers(prev => {
      const existingIndex = prev.findIndex(v => v.id === id);
      if (existingIndex > -1) {
        const updatedVouchers = [...prev];
        updatedVouchers[existingIndex] = { ...voucherData, id };
        return updatedVouchers;
      } else {
        return [...prev, { ...voucherData, id }];
      }
    });
  }, []);

  const deleteVoucher = useCallback((voucherId: string) => {
    setVouchers(prev => prev.filter(v => v.id !== voucherId));
  }, []);

  return { 
    providers, 
    vouchers, 
    activityLogs,
    addProvider, 
    deleteProvider,
    addVoucher, 
    updateVoucher, 
    upsertVoucher,
    deleteVoucher,
    addLog,
  };
};