import React, { useEffect, useMemo, useState } from 'react';
import { Droplet, Clock, MapPin, CheckCircle2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { StorageService } from '../services/storage';
import { RegistroLeche, Finca, User } from '../types';

type Props = {
  isOnline: boolean;
  currentUser: User | null;
};

const History: React.FC<Props> = ({ isOnline, currentUser }) => {
  const [registros, setRegistros] = useState<RegistroLeche[]>([]);
  const [fincas, setFincas] = useState<Finca[]>([]);

  useEffect(() => {
    // Cargar datos locales
    const all = StorageService.getRegistros() || [];
    // Orden cronológico: recientes primero
    const sorted = [...all].sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
    setRegistros(sorted);
    setFincas(StorageService.getFincas() || []);
  }, []);

  const fincaById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const f of fincas) map[f.id] = f.nombre;
    return map;
  }, [fincas]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const pendingCount = useMemo(() => registros.filter(r => !r.synced).length, [registros]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Droplet className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Historial de Recolecciones</h1>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">En línea</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-700">Sin conexión</span>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Total: <span className="font-semibold">{registros.length}</span> · Pendientes: <span className="font-semibold">{pendingCount}</span>
          </p>
          {currentUser && (
            <p className="mt-1 text-xs text-gray-500">Usuario: {currentUser.usuario}</p>
          )}
        </div>

        {/* Lista */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {registros.length === 0 ? (
            <div className="text-center py-12">
              <Droplet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay registros aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registros.map((r) => (
                <div
                  key={r.id}
                  className={`p-4 border rounded-lg ${r.synced ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="text-lg font-semibold text-gray-900">{r.cantidad}L</div>
                        <div className="text-gray-700">${r.saldo.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{fincaById[r.fkFinca] || `Finca #${r.fkFinca}`}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-600 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {formatDate(r.fechaHora)}
                      </div>
                      <div className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${r.synced ? 'text-green-700' : 'text-yellow-700'}`}>
                        {r.synced ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Sincronizado
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Pendiente
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
