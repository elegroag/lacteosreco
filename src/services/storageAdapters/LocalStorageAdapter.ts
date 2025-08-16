import { IStorageAdapter, STORAGE_KEYS } from './IStorageAdapter';

export class LocalStorageAdapter implements IStorageAdapter {
    async init(): Promise<void> {
        // No-op para localStorage
    }

    // Usuario
    saveUser(user: any): void {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
    getUser(): any | null {
        const user = localStorage.getItem(STORAGE_KEYS.USER);
        return user ? JSON.parse(user) : null;
    }
    clearUser(): void {
        localStorage.removeItem(STORAGE_KEYS.USER);
    }

    // Fincas
    saveFincas(fincas: any[]): void {
        localStorage.setItem(STORAGE_KEYS.FINCAS, JSON.stringify(fincas));
    }
    getFincas(): any[] {
        const fincas = localStorage.getItem(STORAGE_KEYS.FINCAS);
        return fincas ? JSON.parse(fincas) : [];
    }

    // Registros
    saveRegistro(registro: any): any {
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
    getRegistros(): any[] {
        const registros = localStorage.getItem(STORAGE_KEYS.REGISTROS);
        return registros ? JSON.parse(registros) : [];
    }
    getPendingRegistros(): any[] {
        return this.getRegistros().filter((r: any) => !r.synced);
    }
    markRegistrosAsSynced(syncedIds: number[]): void {
        const registros = this.getRegistros();
        const updated = registros.map((r: any) => (syncedIds.includes(r.id) ? { ...r, synced: true } : r));
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
