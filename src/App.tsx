import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { FarmSelection } from './components/FarmSelection';
import { MilkRegistration } from './components/MilkRegistration';
import { SyncManager } from './components/SyncManager';
import { Notification } from './components/Notification';
import { StorageService } from './services/storage';
import { useConnectivity } from './hooks/useConnectivity';
import { AppState, Finca } from './types';
import { LogOut, Wifi, WifiOff, User, Lock, Loader2 } from 'lucide-react';
import { ApiService } from './services/api';

function App() {
  const [appState, setAppState] = useState<AppState>({
    isLoggedIn: false,
    currentUser: null,
    selectedFarm: null,
    currentView: 'login'
  });

  const [notifications, setNotifications] = useState<Array<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>>([]);

  const isOnline = useConnectivity();

  useEffect(() => {
    // Verificar si hay un usuario logueado al cargar la app
    const savedUser = StorageService.getUser();
    if (savedUser) {
      setAppState(prev => ({
        ...prev,
        isLoggedIn: true,
        currentUser: savedUser,
        currentView: 'farmSelection'
      }));
    }
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleLogin = (user: any) => {
    setAppState(prev => ({
      ...prev,
      isLoggedIn: true,
      currentUser: user,
      currentView: 'farmSelection'
    }));
  };

  const handleShowRegister = () => {
    setAppState(prev => ({ ...prev, currentView: 'register' }));
  };

  const handleRegistered = (user: any) => {
    setAppState(prev => ({
      ...prev,
      isLoggedIn: true,
      currentUser: user,
      currentView: 'farmSelection'
    }));
  };

  const handleBackToLogin = () => {
    setAppState(prev => ({ ...prev, currentView: 'login' }));
  };

  const handleFarmSelect = (farm: Finca) => {
    setAppState(prev => ({
      ...prev,
      selectedFarm: farm,
      currentView: 'milkRegistration'
    }));
  };

  const handleBackToFarmSelection = () => {
    setAppState(prev => ({
      ...prev,
      selectedFarm: null,
      currentView: 'farmSelection'
    }));
  };

  const handleLogout = () => {
    StorageService.clearUser();
    setAppState({
      isLoggedIn: false,
      currentUser: null,
      selectedFarm: null,
      currentView: 'login'
    });
    showNotification('Sesión cerrada correctamente', 'info');
  };

  const renderCurrentView = () => {
    switch (appState.currentView) {
      case 'login':
        return (
          <Login 
            onLogin={handleLogin} 
            showNotification={showNotification}
            onShowRegister={handleShowRegister}
          />
        );
      case 'register':
        return (
          <RegisterView 
            isOnline={isOnline}
            onRegistered={handleRegistered}
            onCancel={handleBackToLogin}
            showNotification={showNotification}
          />
        );
      case 'farmSelection':
        return (
          <FarmSelection
            currentUser={appState.currentUser}
            onFarmSelect={handleFarmSelect}
            showNotification={showNotification}
            isOnline={isOnline}
          />
        );
      case 'milkRegistration':
        return (
          <MilkRegistration
            currentUser={appState.currentUser}
            selectedFarm={appState.selectedFarm!}
            onBack={handleBackToFarmSelection}
            showNotification={showNotification}
            isOnline={isOnline}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con estado de conexión y logout */}
      {appState.isLoggedIn && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${
                isOnline ? 'text-green-600' : 'text-red-600'
              }`}>
                {isOnline ? 'En línea' : 'Sin conexión'}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Salir
            </button>
          </div>
        </div>
      )}

      {/* Vista actual */}
      {renderCurrentView()}

      {/* Gestor de sincronización */}
      <SyncManager 
        isOnline={isOnline}
        showNotification={showNotification}
      />

      {/* Notificaciones */}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

// Vista de Registro embebida
const RegisterView: React.FC<{
  isOnline: boolean;
  onRegistered: (user: any) => void;
  onCancel: () => void;
  showNotification: (m: string, t: 'success' | 'error' | 'info' | 'warning') => void;
}> = ({ isOnline, onRegistered, onCancel, showNotification }) => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !contrasena.trim()) {
      showNotification('Usuario y contraseña son requeridos', 'warning');
      return;
    }
    if (contrasena !== confirmar) {
      showNotification('Las contraseñas no coinciden', 'error');
      return;
    }
    if (!isOnline) {
      showNotification('Se requiere conexión para registrarse', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await ApiService.register(usuario, contrasena);
      if (res?.success) {
        const user = { id: res.userId, usuario, contrasena };
        StorageService.saveUser(user);
        showNotification('Registro exitoso. Sesión iniciada.', 'success');
        onRegistered(user);
      } else {
        showNotification(res?.message || 'No se pudo registrar', 'error');
      }
    } catch (err: any) {
      showNotification(err?.message || 'Error registrando usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Crear cuenta</h1>
          <p className="text-gray-600">Regístrate para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ingresa un usuario"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Crea una contraseña"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Repite la contraseña"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear cuenta'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full mt-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Volver al inicio de sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;