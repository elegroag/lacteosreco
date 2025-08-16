import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
// import { SyncService } from '../services/sync';
import { StorageService } from '../services/storage';
import { Finca } from '../types';

interface FarmSelectionProps {
  currentUser: any;
  onFarmSelect: (farm: Finca) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  isOnline: boolean;
}

const FarmSelection: React.FC<FarmSelectionProps> = ({ 
  currentUser, 
  onFarmSelect, 
  showNotification,
  isOnline 
}) => {
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFincas();
  }, []);

  const loadFincas = async () => {
    setIsLoading(true);
    try {
      const localFincas = StorageService.getFincas();
      setFincas(localFincas);
      if (localFincas.length === 0) {
        showNotification('Sin fincas almacenadas en el dispositivo', 'warning');
      }
    } catch (error) {
      showNotification('Error cargando fincas del almacenamiento', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFincas();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seleccionar Finca</h1>
              <p className="text-gray-600">Hola, {currentUser.usuario}</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Cargando fincas...</span>
            </div>
          ) : fincas.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay fincas disponibles</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {fincas.map((finca) => (
                <button
                  key={finca.id}
                  onClick={() => onFarmSelect(finca)}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-900">{finca.nombre}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm font-medium">
            {isOnline ? 'Conectado - Datos actualizados' : 'Sin conexión - Usando datos en caché'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FarmSelection;
