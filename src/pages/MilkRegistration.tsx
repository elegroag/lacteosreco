import React, { useState, useEffect } from 'react';
import { Milk, Save, ArrowLeft, Clock, User, MapPin, DollarSign } from 'lucide-react';
import { StorageService } from '../services/storage';
import { SyncService } from '../services/sync';
import { RegistroLeche, Finca } from '../types';

interface MilkRegistrationProps {
  currentUser: any;
  selectedFarm: Finca;
  onBack: () => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  isOnline: boolean;
}

const MilkRegistration: React.FC<MilkRegistrationProps> = ({
  currentUser,
  selectedFarm,
  onBack,
  showNotification,
  isOnline
}) => {
  const [cantidad, setCantidad] = useState('');
  const [saldo, setSaldo] = useState('');
  const [registros, setRegistros] = useState<RegistroLeche[]>([]);

  useEffect(() => {
    loadRegistros();
  }, []);

  const loadRegistros = () => {
    const allRegistros = StorageService.getRegistros();
    const farmRegistros = allRegistros.filter((r: RegistroLeche) => r.fkFinca === selectedFarm.id);
    setRegistros(farmRegistros);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cantidad.trim() || !saldo.trim()) {
      showNotification('Por favor completa todos los campos', 'warning');
      return;
    }

    const cantidadNum = parseFloat(cantidad);
    const saldoNum = parseFloat(saldo);

    if (isNaN(cantidadNum) || isNaN(saldoNum) || cantidadNum <= 0) {
      showNotification('Por favor ingresa valores válidos', 'error');
      return;
    }

    const nuevoRegistro: RegistroLeche = {
      fkFinca: selectedFarm.id,
      cantidad: cantidadNum,
      saldo: saldoNum,
      fechaHora: new Date().toISOString(),
      fkUsuario: currentUser.id,
    };

    const savedRegistro = StorageService.saveRegistro(nuevoRegistro);
    setRegistros(prev => [savedRegistro, ...prev]);
    
    setCantidad('');
    setSaldo('');
    
    showNotification(
      `Registro guardado ${isOnline ? '(sincronizando...)' : '(en caché)'}`,
      'success'
    );

    // Si estamos en línea, intentar sincronizar inmediatamente
    if (isOnline) {
      const result = await SyncService.syncPendingRecords();
      if (result.success) {
        showNotification(`Sincronizado ${result.syncedCount} registro(s)`, 'success');
        // Recargar lista desde storage para reflejar estados actualizados
        loadRegistros();
      } else {
        showNotification(`No se pudo sincronizar: ${result.error}`, 'error');
      }
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPendingCount = () => {
    return registros.filter(r => !r.synced).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Registro de Leche</h1>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{selectedFarm.nombre}</span>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad (litros)
                </label>
                <div className="relative">
                  <Milk className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    step="0.1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    step="0.01"
                    value={saldo}
                    onChange={(e) => setSaldo(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              Guardar Registro
            </button>
          </form>
        </div>

        {/* Estado de sincronización */}
        <div className={`p-4 rounded-lg mb-6 flex items-center justify-between ${
          isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm font-medium">
              {isOnline ? 'Conectado - Sincronización automática' : `${getPendingCount()} registros pendientes`}
            </span>
          </div>
        </div>

        {/* Lista de registros */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Registros Recientes</h2>
          
          {registros.length === 0 ? (
            <div className="text-center py-8">
              <Milk className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay registros aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registros.slice(0, 10).map((registro) => (
                <div 
                  key={registro.id} 
                  className={`p-4 border rounded-lg ${
                    registro.synced ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-gray-900">
                        {registro.cantidad}L
                      </div>
                      <div className="text-gray-600">
                        ${registro.saldo.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(registro.fechaHora)}
                      </div>
                      <div className={`text-xs font-medium ${
                        registro.synced ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {registro.synced ? 'Sincronizado' : 'Pendiente'}
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

export default MilkRegistration;