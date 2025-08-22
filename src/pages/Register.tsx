import React, { useState } from 'react';
import { User, Lock, Loader2 } from 'lucide-react';
import { StorageService } from '../services/storage';
import { useNavigate } from 'react-router-dom';
import type { User as Usuario } from '../types';

type Props = {
  isOnline: boolean;
  onRegistered: (user: Usuario) => void;
  showNotification: (m: string, t: 'success' | 'error' | 'info' | 'warning') => void;
};

const Register: React.FC<Props> = ({ isOnline, onRegistered, showNotification }) => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    setLoading(true);
    try {
      // Registro 100% local (independiente de conectividad)
      const user = { id: Date.now(), usuario, contrasena };
      StorageService.saveUser(user);
      showNotification('Registro local creado. Sesión iniciada.', 'success');
      onRegistered(user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showNotification(err.message, 'error');
      } else {
        showNotification('Error registrando usuario localmente', 'error');
      }
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

        {!isOnline && (
          <p className="text-xs text-amber-600 mb-4 text-center">Estás sin conexión. El registro se guardará localmente.</p>
        )}

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
            onClick={() => navigate('/login')}
            className="w-full mt-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Volver al inicio de sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
