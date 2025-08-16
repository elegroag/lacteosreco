import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

export const useConnectivity = () => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    let removeListener: (() => void) | undefined;

    const init = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await Network.getStatus();
          setIsOnline(!!status.connected);
          const listener = await Network.addListener('networkStatusChange', (status) => {
            setIsOnline(!!status.connected);
          });
          removeListener = () => listener.remove();
        } catch (e) {
          // Fallback a eventos web si falla
          setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
        }
      } else {
        // Web fallback
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        removeListener = () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
    };

    init();

    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  return isOnline;
};