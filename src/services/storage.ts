import { Finca, Registro, User } from '../types';
import { getStorageAdapter } from './storageAdapter';

// Servicio para manejo de almacenamiento local/nativo vía adaptador
export class StorageService {
  private static get a() {
    return getStorageAdapter();
  }

  // Usuario logueado
  static saveUser(user: User) {
    this.a.saveUser(user);
  }

  static getUser(): User | null {
    return this.a.getUser();
  }

  static clearUser() {
    this.a.clearUser();
  }

  // Fincas
  static saveFincas(fincas: Finca[]) {
    this.a.saveFincas(fincas);
  }

  static getFincas() {
    return this.a.getFincas() as Finca[];
  }

  // Registros de leche
  static saveRegistro(registro: Registro) {
    return this.a.saveRegistro(registro);
  }

  static getRegistros() {
    return this.a.getRegistros() as Registro[];
  }

  static markRegistrosAsSynced(syncedIds: number[]) {
    this.a.markRegistrosAsSynced(syncedIds);
  }

  static getPendingRegistros() {
    return this.a.getPendingRegistros() as Registro[];
  }

  // Última sincronización
  static setLastSync(timestamp: string) {
    this.a.setLastSync(timestamp);
  }

  static getLastSync() {
    return this.a.getLastSync() as string;
  }
}