export interface IStorageAdapter {
    init(): Promise<void>;

    // Usuario
    saveUser(user: any): void;
    getUser(): any | null;
    clearUser(): void;

    // Fincas
    saveFincas(fincas: any[]): void;
    getFincas(): any[];

    // Registros
    saveRegistro(registro: any): any; // retorna el registro insertado (con id/synced)
    getRegistros(): any[];
    getPendingRegistros(): any[];
    markRegistrosAsSynced(syncedIds: number[]): void;

    // Meta
    setLastSync(timestamp: string): void;
    getLastSync(): string | null;
}

export const STORAGE_KEYS = {
    USER: 'milk_app_user',
    FINCAS: 'milk_app_fincas',
    REGISTROS: 'milk_app_registros',
    LAST_SYNC: 'milk_app_last_sync',
};
