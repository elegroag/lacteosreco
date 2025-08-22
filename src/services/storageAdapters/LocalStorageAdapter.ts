import { Finca, Registro, User } from '../../types';
import { IStorageAdapter, STORAGE_KEYS } from './IStorageAdapter';

export class LocalStorageAdapter implements IStorageAdapter {
    async init(): Promise<void> {
        // No-op para localStorage
    }

    // Usuario
    saveUser(user: User): void {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    getUser(): User | null {
        const user = localStorage.getItem(STORAGE_KEYS.USER);
        return user ? JSON.parse(user) : null;
    }

    clearUser(): void {
        localStorage.removeItem(STORAGE_KEYS.USER);
    }

    // Fincas
    saveFincas(fincas: Finca[]): void {
        localStorage.setItem(STORAGE_KEYS.FINCAS, JSON.stringify(fincas));
    }
    getFincas(): Finca[] {
        const fincas = localStorage.getItem(STORAGE_KEYS.FINCAS);
        return fincas ? JSON.parse(fincas) : [];
    }

    // Registros
    saveRegistro(registro: Registro): Registro {
        const registros = this.getRegistros();
        const newRegistro = {
            ...registro,
            id: Date.now(),
            synced: false,
        };
        registros.push(newRegistro);
        localStorage.setItem(STORAGE_KEYS.REGISTROS, JSON.stringify(registros));
        return newRegistro;
    }
    getRegistros(): Registro[] {
        const registros = localStorage.getItem(STORAGE_KEYS.REGISTROS);
        return registros ? JSON.parse(registros) : [];
    }
    getPendingRegistros(): Registro[] {
        return this.getRegistros().filter((r: Registro) => !r.synced);
    }
    markRegistrosAsSynced(syncedIds: number[]): void {
        const registros = this.getRegistros();
        const updated = registros.map((r: Registro) => (syncedIds.includes(r.id) ? { ...r, synced: true } : r));
        localStorage.setItem(STORAGE_KEYS.REGISTROS, JSON.stringify(updated));
    }

    // Meta
    setLastSync(timestamp: string): void {
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
    }
    getLastSync(): string | null {
        return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    }
}
