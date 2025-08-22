// Tipos de datos para la aplicación
export interface User {
  id: number;
  usuario: string;
  contrasena?: string;
  email?: string;
  telefono?: string;
  cedula?: string;
  conectado?: boolean;
}

export interface Finca {
  id: number;
  nombre: string;
}

export interface RegistroLeche {
  id?: number;
  fkFinca: number;
  cantidad: number;
  saldo: number;
  fechaHora: string;
  fkUsuario: number;
  synced?: boolean;
}

export interface Registro extends RegistroLeche {
  id: number;
  observaciones?: string;
}

export interface AppState {
  isLoggedIn: boolean;
  currentUser: User | null;
  selectedFarm: Finca | null;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingRecords: number;
  lastSync: string | null;
}

export type Error = {
  message?: string;
  code?: string;
  status?: number;
}
  