import { IStorageAdapter } from './IStorageAdapter';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

// Nota: Este adaptador mantiene una caché en memoria para exponer una API síncrona
// como la de localStorage. Las escrituras a SQLite se hacen de forma asíncrona.

export class SqliteStorageAdapter implements IStorageAdapter {
    private db: SQLiteDBConnection | null = null;
    private sqlite: SQLiteConnection | null = null;
    private initialized = false;

    private cache = {
        user: null as any | null,
        fincas: [] as any[],
        registros: [] as any[],
        lastSync: null as string | null,
    };

    async init(): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
            // En web no inicializamos SQLite
            this.initialized = true;
            return;
        }

        try {
            this.sqlite = new SQLiteConnection(CapacitorSQLite);
            this.db = await this.sqlite.createConnection('milkdb', false, 'no-encryption', 1, false);
            await this.db.open();

            // Tablas
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS meta (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
            `);

            // Tabla de usuarios (alineada con backend: 'contrasena')
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS user (
                    id INTEGER PRIMARY KEY,
                    usuario TEXT NOT NULL,
                    contrasena TEXT,
                    email TEXT,
                    telefono TEXT,
                    cedula TEXT
                );
            `);

            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS registros (
                    id INTEGER PRIMARY KEY,
                    fkFinca INTEGER,
                    cantidad REAL,
                    saldo REAL,
                    fechaHora TEXT,
                    observaciones TEXT,
                    fkUsuario INTEGER,
                    synced INTEGER DEFAULT 0
                );
            `);

            // Cargar caché desde la BD
            await this.loadCacheFromDb();

            this.initialized = true;
        } catch (err) {
            console.error('[SqliteStorageAdapter] Error inicializando SQLite, se continuará con caché en memoria:', err);
            this.initialized = true; // permitir uso en memoria si falla
        }
    }

    // Usuario
    saveUser(user: any): void {
        this.cache.user = user;
        this.persistMeta('USER', JSON.stringify(user));
        // Persistir también en la tabla user (un solo registro)
        (async () => {
            try {
                if (!this.db) return;
                await this.db.run('DELETE FROM user');
                await this.db.run(
                    `INSERT INTO user (id, usuario, contrasena, email, telefono, cedula) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        user?.id ?? null,
                        user?.usuario ?? '',
                        user?.contrasena ?? null,
                        user?.email ?? null,
                        user?.telefono ?? null,
                        user?.cedula ?? null,
                    ]
                );
            } catch (err) {
                console.warn('[SqliteStorageAdapter] saveUser persistencia en tabla user falló', err);
            }
        })();
    }
    getUser(): any | null {
        return this.cache.user;
    }
    clearUser(): void {
        this.cache.user = null;
        this.persistMeta('USER', null);
        (async () => {
            try {
                if (!this.db) return;
                await this.db.run('DELETE FROM user');
            } catch (err) {
                console.warn('[SqliteStorageAdapter] clearUser limpiar tabla user falló', err);
            }
        })();
    }

    // Fincas
    saveFincas(fincas: any[]): void {
        this.cache.fincas = fincas || [];
        this.persistMeta('FINCAS', JSON.stringify(this.cache.fincas));
    }
    getFincas(): any[] {
        return this.cache.fincas;
    }

    // Registros
    saveRegistro(registro: any): any {
        const newRegistro = {
            ...registro,
            id: registro?.id ?? Date.now(),
            synced: false,
        };
        this.cache.registros.push(newRegistro);
        this.insertRegistroAsync(newRegistro);
        return newRegistro;
    }
    getRegistros(): any[] {
        // devolver copia superficial para evitar mutaciones externas
        return [...this.cache.registros];
    }
    getPendingRegistros(): any[] {
        return this.cache.registros.filter((r: any) => !r.synced);
    }
    markRegistrosAsSynced(syncedIds: number[]): void {
        if (!syncedIds || syncedIds.length === 0) return;
        const setIds = new Set(syncedIds);
        this.cache.registros = this.cache.registros.map((r: any) => (setIds.has(r.id) ? { ...r, synced: true } : r));
        this.updateSyncedAsync(syncedIds);
    }

    // Meta
    setLastSync(timestamp: string): void {
        this.cache.lastSync = timestamp;
        this.persistMeta('LAST_SYNC', timestamp);
    }
    getLastSync(): string | null {
        return this.cache.lastSync;
    }

    // Helpers privados
    private async loadCacheFromDb() {
        if (!this.db) return;
        // meta
        const metaRes = await this.db.query('SELECT key, value FROM meta');
        const metaRows = metaRes.values || [];
        for (const row of metaRows) {
            if (row.key === 'USER') this.cache.user = row.value ? JSON.parse(row.value) : null;
            if (row.key === 'FINCAS') this.cache.fincas = row.value ? JSON.parse(row.value) : [];
            if (row.key === 'LAST_SYNC') this.cache.lastSync = row.value ?? null;
        }

        // Si no hay usuario en meta, intentar cargar desde la tabla user
        if (!this.cache.user) {
            try {
                const userRes = await this.db.query('SELECT id, usuario, contrasena, email, telefono, cedula FROM user LIMIT 1');
                const u = (userRes.values || [])[0];
                if (u) {
                    this.cache.user = {
                        id: u.id,
                        usuario: u.usuario,
                        contrasena: u.contrasena ?? undefined,
                        email: u.email ?? undefined,
                        telefono: u.telefono ?? undefined,
                        cedula: u.cedula ?? undefined,
                    };
                }
            } catch (err) {
                console.warn('[SqliteStorageAdapter] loadCacheFromDb: no se pudo leer tabla user', err);
            }
        }

        // registros
        const regRes = await this.db.query('SELECT id, fkFinca, cantidad, saldo, fechaHora, observaciones, fkUsuario, synced FROM registros ORDER BY date(fechaHora) DESC');
        const regs = regRes.values || [];
        this.cache.registros = regs.map((r: any) => ({
            id: r.id,
            fkFinca: r.fkFinca,
            cantidad: r.cantidad,
            saldo: r.saldo ?? 0,
            fechaHora: r.fechaHora,
            observaciones: r.observaciones ?? '',
            fkUsuario: r.fkUsuario,
            synced: !!r.synced,
        }));
    }

    private async persistMeta(key: 'USER' | 'FINCAS' | 'LAST_SYNC', value: string | null) {
        try {
            if (!this.db) return;
            if (value === null) {
                await this.db.run('DELETE FROM meta WHERE key = ?', [key]);
            } else {
                await this.db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [key, value]);
            }
        } catch (err) {
            console.warn('[SqliteStorageAdapter] persistMeta error', err);
        }
    }

    private async insertRegistroAsync(r: any) {
        try {
            if (!this.db) return;
            await this.db.run(
                `INSERT OR REPLACE INTO registros (id, fkFinca, cantidad, saldo, fechaHora, observaciones, fkUsuario, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [r.id, r.fkFinca, r.cantidad, r.saldo ?? 0, r.fechaHora, r.observaciones ?? '', r.fkUsuario, r.synced ? 1 : 0]
            );
        } catch (err) {
            console.warn('[SqliteStorageAdapter] insertRegistroAsync error', err);
        }
    }

    private async updateSyncedAsync(ids: number[]) {
        try {
            if (!this.db || ids.length === 0) return;
            // Construir placeholders
            const placeholders = ids.map(() => '?').join(',');
            await this.db.run(`UPDATE registros SET synced = 1 WHERE id IN (${placeholders})`, ids as any);
        } catch (err) {
            console.warn('[SqliteStorageAdapter] updateSyncedAsync error', err);
        }
    }
}
