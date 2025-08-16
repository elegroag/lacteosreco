import React, { useEffect, useState } from 'react';
import { UploadCloud, DownloadCloud, RefreshCw } from 'lucide-react';
import { StorageService } from '../services/storage';
import { SyncService } from '../services/sync';
import { useNavigate } from 'react-router-dom';

type Props = {
  isOnline: boolean;
  currentUser: any;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
};

const Sync: React.FC<Props> = ({ isOnline, currentUser, showNotification }) => {
  const [pending, setPending] = useState<number>(0);
  const [lastSync, setLastSyncState] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [fetchingFincas, setFetchingFincas] = useState<boolean>(false);
  const [syncAllRunning, setSyncAllRunning] = useState<boolean>(false);
  const navigate = useNavigate();

  const loadStatus = () => {
    try {
      const p = StorageService.getPendingRegistros()?.length ?? 0;
      const ls = StorageService.getLastSync();
      setPending(p);
      setLastSyncState(ls);
    } catch (err) {
      console.warn('[Sync] loadStatus error', err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // Recalcular cuando cambie el usuario (p.ej. tras login o restauración de sesión)
  useEffect(() => {
    loadStatus();
  }, [currentUser]);

  // Recalcular al volver el foco a la ventana (p. ej. tras navegar/volver)
  useEffect(() => {
    const onFocus = () => loadStatus();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const syncRegistros = async () => {
    if (pending === 0) {
      showNotification('No hay registros pendientes', 'info');
      return;
    }
    if (!isOnline) {
      showNotification('Sin conexión. Conéctate para sincronizar.', 'warning');
      return;
    }

    setSyncing(true);
    try {
      const result = await SyncService.syncPendingRecords();
      if (result.success) {
        showNotification(`Sincronizados ${result.syncedCount} registro(s)`, 'success');
        setLastSyncState(StorageService.getLastSync());
        setPending(StorageService.getPendingRegistros().length);
      } else {
        showNotification(result.error || 'Error en sincronización', 'error');
      }
    } catch (e) {
      showNotification('Error de conexión con el servidor', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const fetchFincas = async () => {
    if (!isOnline) {
      showNotification('Sin conexión. Conéctate para actualizar fincas.', 'warning');
      return;
    }
    setFetchingFincas(true);
    try {
      const fincas = await SyncService.fetchFincas();
      StorageService.saveFincas(fincas || []);
      // No cambia contadores, pero refrescamos por si el adaptador tuvo side-effects
      loadStatus();
    } catch (e) {
      showNotification('Error obteniendo fincas del servidor', 'error');
    } finally {
      setFetchingFincas(false);
    }
  };

  const syncAll = async () => {
    if (!isOnline) {
      showNotification('Sin conexión. Conéctate para sincronizar.', 'warning');
      return;
    }
    setSyncAllRunning(true);
    try {
      // 1) Fincas: Servidor -> Local
      try {
        const fincas = await SyncService.fetchFincas();
        StorageService.saveFincas(fincas || []);
      } catch (e) {
        showNotification('No se pudieron actualizar fincas', 'error');
      }

      // 2) Registros: Local -> Servidor
      const result = await SyncService.syncPendingRecords();
      if (result.success) {
        showNotification(`Sincronización completa. Registros enviados: ${result.syncedCount}`, 'success');
      } else {
        showNotification(result.error || 'Error al enviar registros', 'error');
      }

      // Actualizar estado local
      setLastSyncState(StorageService.getLastSync());
      setPending(StorageService.getPendingRegistros().length);
    } finally {
      setSyncAllRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sincronización</h1>
          <p className="text-gray-600 text-sm">LocalStorage en web, SQLite en Android.</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <button
            onClick={syncAll}
            disabled={syncAllRunning || !isOnline}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-60"
          >
            <RefreshCw className={`w-5 h-5 ${syncAllRunning ? 'animate-spin' : ''}`} />
            {syncAllRunning ? 'Sincronizando...' : 'Sincronizar todo'}
          </button>
          <div className="text-xs text-gray-500 mt-3">
            Estado: {isOnline ? 'En línea' : 'Sin conexión'} · Pendientes: {pending} · Última sync: {lastSync ? new Date(lastSync).toLocaleString('es-ES') : 'Nunca'}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Registros de leche: Local -> Servidor */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Registros de leche</h2>
              <span className={`text-xs px-2 py-1 rounded ${pending > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {pending} pendientes
              </span>
            </div>
            <button
              onClick={syncRegistros}
              disabled={syncing}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-60"
            >
              <UploadCloud className="w-5 h-5" />
              {syncing ? 'Sincronizando...' : 'Enviar al servidor'}
            </button>
            <div className="text-xs text-gray-500 mt-3">
              Última sincronización: {lastSync ? new Date(lastSync).toLocaleString('es-ES') : 'Nunca'}
            </div>
          </div>

          {/* Fincas: Servidor -> Local */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Fincas</h2>
            </div>
            <button
              onClick={fetchFincas}
              disabled={fetchingFincas}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60"
            >
              <DownloadCloud className="w-5 h-5" />
              {fetchingFincas ? 'Actualizando...' : 'Traer del servidor'}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sync;
