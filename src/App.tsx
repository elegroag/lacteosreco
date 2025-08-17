import React, { useState, useEffect, lazy, Suspense } from 'react';
import { LogOut, Wifi, WifiOff, Home, Droplet, RefreshCw } from 'lucide-react';
import { initStorage } from './services/storageAdapter';
import { Routes, Route, Navigate, useNavigate, useLocation, NavLink } from 'react-router-dom';
// import { SyncManager } from './components/SyncManager';
import { Notification } from './components/Notification';
import { StorageService } from './services/storage';
import { useConnectivity } from './hooks/useConnectivity';
import { AppState, Finca } from './types';

// Lazy load de páginas desde componentes actuales (se moverán a src/pages/)
const LoginPage = lazy(() => import('./pages/Login'));
const FarmSelectionPage = lazy(() => import('./pages/FarmSelection'));
const MilkRegistrationPage = lazy(() => import('./pages/MilkRegistration'));
const RegisterPage = lazy(() => import('./pages/Register'));
const SyncPage = lazy(() => import('./pages/Sync'));

function App() {
  const [appState, setAppState] = useState<AppState>({
    isLoggedIn: false,
    currentUser: null,
    selectedFarm: null
  });

  const [notifications, setNotifications] = useState<Array<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>>([]);

  const isOnline = useConnectivity();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Inicializar almacenamiento, sembrar finca por defecto y luego verificar usuario guardado
    const boot = async () => {
      await initStorage();

      // Sembrar una finca por defecto si no existen
      const existingFincas = StorageService.getFincas();
      if (!existingFincas || existingFincas.length === 0) {
        const defaultFinca: Finca = { id: 1, nombre: 'Finca Principal' };
        StorageService.saveFincas([defaultFinca]);
      }

      const savedUser = StorageService.getUser();
      if (savedUser) {
        setAppState(prev => ({
          ...prev,
          isLoggedIn: true,
          currentUser: savedUser
        }));
        // Solo auto-navegar si estamos en la raíz para no sobreescribir rutas manuales (p.ej. /sync)
        if (location.pathname === '/') {
          navigate('/fincas', { replace: true });
        }
      } else {
        // Solo redirigir automáticamente desde la raíz
        if (location.pathname === '/') {
          navigate('/login', { replace: true });
        }
      }
    };
    boot();
  }, [location.pathname]);

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
      currentUser: user
    }));
    navigate('/fincas', { replace: true });
  };

  const handleRegistered = (user: any) => {
    setAppState(prev => ({
      ...prev,
      isLoggedIn: true,
      currentUser: user
    }));
    navigate('/fincas', { replace: true });
  };

  const handleFarmSelect = (farm: Finca) => {
    setAppState(prev => ({
      ...prev,
      selectedFarm: farm
    }));
    navigate('/registros');
  };

  const handleBackToFarmSelection = () => {
    setAppState(prev => ({
      ...prev,
      selectedFarm: null
    }));
    navigate('/fincas');
  };

  const handleLogout = () => {
    // No borrar el usuario del almacenamiento persistente
    setAppState({
      isLoggedIn: false,
      currentUser: null,
      selectedFarm: null
    });
    showNotification('Sesión cerrada correctamente', 'info');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
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

      {/* Rutas */}
      <Suspense fallback={<div className="p-4 text-center text-gray-600">Cargando...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to={appState.isLoggedIn ? '/fincas' : '/login'} replace />} />
          <Route 
            path="/login" 
            element={
              <LoginPage 
                onLogin={handleLogin} 
                showNotification={showNotification}
                onShowRegister={() => navigate('/register')}
              />
            } 
          />
          <Route 
            path="/register" 
            element={
              <RegisterPage 
                isOnline={isOnline}
                onRegistered={handleRegistered}
                showNotification={showNotification}
              />
            } 
          />
          <Route 
            path="/fincas" 
            element={
              <ProtectedRoute isLoggedIn={appState.isLoggedIn}>
                <FarmSelectionPage
                  currentUser={appState.currentUser}
                  onFarmSelect={handleFarmSelect}
                  showNotification={showNotification}
                  isOnline={isOnline}
                />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/registros" 
            element={
              <ProtectedRoute isLoggedIn={appState.isLoggedIn}>
                {appState.selectedFarm ? (
                  <MilkRegistrationPage
                    currentUser={appState.currentUser}
                    selectedFarm={appState.selectedFarm}
                    onBack={handleBackToFarmSelection}
                    showNotification={showNotification}
                    isOnline={isOnline}
                  />
                ) : (
                  <Navigate to="/fincas" replace />
                )}
              </ProtectedRoute>
            }
          />
          <Route 
            path="/sync" 
            element={
              <ProtectedRoute isLoggedIn={appState.isLoggedIn}>
                <SyncPage 
                  isOnline={isOnline}
                  currentUser={appState.currentUser}
                  showNotification={showNotification}
                />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Footer de navegación fijo (solo logueado) */}
      {appState.isLoggedIn && (
        <nav className="fixed bottom-0 inset-x-0 bg-white border-t shadow-md">
          <div className="max-w-2xl mx-auto">
            <ul className="flex items-center justify-around py-2">
              <li>
                <NavLink
                  to="/fincas"
                  className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  <Home className="w-5 h-5" />
                  Fincas
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/history"
                  className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  <Droplet className="w-5 h-5" />
                  Historial 
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/sync"
                  className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  <RefreshCw className="w-5 h-5" />
                  Sync
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>
      )}
 
      {/* Gestor de sincronización deshabilitado: guardado local únicamente */}
      {/* <SyncManager 
        isOnline={isOnline}
        showNotification={showNotification}
      /> */}

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

// Ruta protegida simple
const ProtectedRoute: React.FC<{ isLoggedIn: boolean; children: React.ReactNode }> = ({ isLoggedIn, children }) => {
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default App;