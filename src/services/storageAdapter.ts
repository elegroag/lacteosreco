import { Capacitor } from '@capacitor/core';
import { IStorageAdapter } from './storageAdapters/IStorageAdapter';
import { LocalStorageAdapter } from './storageAdapters/LocalStorageAdapter';
import { SqliteStorageAdapter } from './storageAdapters/SqliteStorageAdapter';

let adapter: IStorageAdapter | null = null;

export const getStorageAdapter = (): IStorageAdapter => {
    if (!adapter) {
        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
            adapter = new SqliteStorageAdapter();
        } else {
            adapter = new LocalStorageAdapter();
        }
    }
    return adapter;
};

export const initStorage = async () => {
    const a = getStorageAdapter();
    await a.init();
};
