
import { useState, useEffect, useCallback } from 'react';
import { firestore } from '../firebase/config';
import type { Provider, Voucher, ActivityLog } from '../types';

const defaultProvidersData = [
  { originalId: 1, name: 'Telkomsel', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Telkomsel_2021_icon.svg' },
  { originalId: 2, name: 'IM3', logoUrl: 'https://im3-img.indosatooredoo.com/indosatassets/images/icons/icon-512x512.png' },
  { originalId: 3, name: 'Three', logoUrl: 'https://iconape.com/wp-content/png_logo_vector/3-logo-2.png' },
  { originalId: 4, name: 'XL', logoUrl: 'https://static.vecteezy.com/system/resources/previews/071/673/737/non_2x/xl-axiata-logo-glossy-square-xl-axiata-telecom-symbol-free-png.png' },
  { originalId: 5, name: 'Axis', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Axis_logo_2015.svg/1200px-Axis_logo_2015.svg.png' },
  { originalId: 6, name: 'Smartfren', logoUrl: 'https://images.seeklogo.com/logo-png/20/2/smartfren-logo-png_seeklogo-202951.png' },
  { originalId: 7, name: 'By.U', logoUrl: 'https://bigrit.com/wp-content/uploads/2020/11/byu.png' },
];

export const useFirestoreStore = (userId: string) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const userDocRef = firestore.collection('users').doc(userId);

  // Set up default providers for new users
  useEffect(() => {
    if (!userId) return;
    const providerCollection = userDocRef.collection('providers');
    providerCollection.get().then(snapshot => {
      if (snapshot.empty) {
        const batch = firestore.batch();
        defaultProvidersData.forEach(p => {
          const newProviderRef = providerCollection.doc();
          batch.set(newProviderRef, p);
        });
        batch.commit();
      }
    });
  }, [userId]);
  
  // Real-time listeners for all collections
  useEffect(() => {
    if (!userId) {
        setLoading(false);
        return;
    };

    setLoading(true);

    const unsubProviders = userDocRef.collection('providers').orderBy('originalId').onSnapshot(snapshot => {
        const providersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Provider));
        setProviders(providersData);
        // This is the critical fix: only set loading to false AFTER the first set of essential data has arrived.
        setLoading(false); 
    }, (error) => {
        console.error("Error fetching providers:", error);
        setLoading(false); // Also stop loading on error.
    });

    const unsubVouchers = userDocRef.collection('vouchers').onSnapshot(snapshot => {
      const vouchersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voucher));
      setVouchers(vouchersData);
    });

    const unsubLogs = userDocRef.collection('activityLogs').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
      setActivityLogs(logsData);
    });
    
    return () => {
      unsubProviders();
      unsubVouchers();
      unsubLogs();
    };
  }, [userId]);

  const addLog = useCallback(async (type: ActivityLog['type'], message: string) => {
    await userDocRef.collection('activityLogs').add({
        timestamp: new Date().toISOString(),
        type,
        message,
    });
  }, [userId]);

  const addProvider = useCallback(async (providerData: Omit<Provider, 'id'>) => {
     await userDocRef.collection('providers').add(providerData);
  }, [userId]);
  
  const findProviderByOriginalId = useCallback(async (originalId: number): Promise<Provider | null> => {
      const snapshot = await userDocRef.collection('providers').where('originalId', '==', originalId).limit(1).get();
      if (snapshot.empty) {
          return null;
      }
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Provider;
  }, [userId]);

  const deleteProvider = useCallback(async (providerId: string) => {
    const batch = firestore.batch();
    
    // Delete the provider
    batch.delete(userDocRef.collection('providers').doc(providerId));
    
    // Find and delete all associated vouchers
    const vouchersSnapshot = await userDocRef.collection('vouchers').where('providerId', '==', providerId).get();
    vouchersSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
  }, [userId]);
  
  const updateVoucher = useCallback(async (updatedVoucher: Voucher) => {
    const { id, ...data } = updatedVoucher;
    await userDocRef.collection('vouchers').doc(id).update(data);
  }, [userId]);
  
  const upsertVoucher = useCallback(async (voucherData: Omit<Voucher, 'id' | 'providerId'> & { providerId: string }) => {
    const voucherQuery = userDocRef.collection('vouchers')
      .where('providerId', '==', voucherData.providerId)
      .where('name', '==', voucherData.name)
      .limit(1);

    const snapshot = await voucherQuery.get();

    if (!snapshot.empty) {
      // Update existing
      const doc = snapshot.docs[0];
      await doc.ref.update(voucherData);
    } else {
      // Add new
      await userDocRef.collection('vouchers').add(voucherData);
    }
  }, [userId]);

  const deleteVoucher = useCallback(async (voucherId: string) => {
    await userDocRef.collection('vouchers').doc(voucherId).delete();
  }, [userId]);

  return { 
    providers, 
    vouchers, 
    activityLogs,
    loading,
    addProvider,
    findProviderByOriginalId,
    deleteProvider,
    updateVoucher, 
    upsertVoucher,
    deleteVoucher,
    addLog,
  };
};
