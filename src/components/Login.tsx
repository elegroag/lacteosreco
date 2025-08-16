import React, { useState } from 'react';
import { User, Lock, LogIn, Loader2 } from 'lucide-react';
import { StorageService } from '../services/storage';

interface LoginProps {
  onLogin: (user: any) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onShowRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, showNotification, onShowRegister }) => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario.trim() || !contrasena.trim()) {
      showNotification('Por favor ingresa usuario y contraseña', 'warning');
      return;
    }

    setIsLoading(true);
    
    try {
      const savedUser = StorageService.getUser();
      if (savedUser && savedUser.usuario === usuario && savedUser.contrasena === contrasena) {
        onLogin(savedUser);
        showNotification('¡Bienvenido! Sesión iniciada correctamente', 'success');
      } else {
        showNotification('Usuario o contraseña incorrectos', 'error');
      }
    } catch (error) {
      showNotification('Error validando credenciales en almacenamiento local', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Recolección de Leche</h1>
          <p className="text-gray-600">Ingresa tus credenciales</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ingresa tu usuario"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ingresa tu contraseña"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={onShowRegister}
            className="text-green-600 hover:underline"
          >
            ¿No tienes cuenta? Regístrate
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Usuarios de prueba:</p>
          <p>admin / 123456</p>
          <p>recolector1 / pass123</p>
        </div>
      </div>
    </div>
  );
};