import { getStorageAdapter } from './storageAdapter';

// Servicio para manejo de almacenamiento local/nativo vía adaptador
export class StorageService {
  private static get a() {
    return getStorageAdapter();
  }

  // Usuario logueado
  static saveUser(user: any) {
    this.a.saveUser(user);
  }

  static getUser() {
    return this.a.getUser();
  }

  static clearUser() {
    this.a.clearUser();
  }

  // Fincas
  static saveFincas(fincas: any[]) {
    this.a.saveFincas(fincas);
  }

  static getFincas() {
    return this.a.getFincas();
  }

  // Registros de leche
  static saveRegistro(registro: any) {
    return this.a.saveRegistro(registro);
  }

  static getRegistros() {
    return this.a.getRegistros();
  }

  static markRegistrosAsSynced(syncedIds: number[]) {
    this.a.markRegistrosAsSynced(syncedIds);
  }

  static getPendingRegistros() {
    return this.a.getPendingRegistros();
  }

  // Última sincronización
  static setLastSync(timestamp: string) {
    this.a.setLastSync(timestamp);
  }

  static getLastSync() {
    return this.a.getLastSync();
  }
}