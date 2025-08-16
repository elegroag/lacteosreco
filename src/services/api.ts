// Configuración de la API
// En desarrollo web usamos ruta relativa para aprovechar el proxy de Vite y evitar CORS
// En móvil (Capacitor), configurar VITE_API_BASE_URL, por ejemplo: https://dibeltran03.alwaysdata.net/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Función helper para hacer requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }

    return data;
  } catch (error) {
    console.error('Error en API request:', error);
    throw error;
  }
};

export const ApiService = {
  // Autenticación
  login: async (usuario: string, contrasena: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, contrasena }),
    });
  },
  register: async (usuario: string, contrasena: string) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ usuario, contrasena }),
    });
  },

  // Fincas
  getFincas: async () => {
    return apiRequest('/fincas');
  },

  getFinca: async (id: number) => {
    return apiRequest(`/fincas/${id}`);
  },

  // Registros
  createRegistro: async (registro: any) => {
    return apiRequest('/registros', {
      method: 'POST',
      body: JSON.stringify(registro),
    });
  },

  syncRegistros: async (registros: any[]) => {
    return apiRequest('/registros/sync', {
      method: 'POST',
      body: JSON.stringify({ registros }),
    });
  },

  getRegistrosByFinca: async (fincaId: number) => {
    return apiRequest(`/registros/finca/${fincaId}`);
  },

  // Health check
  healthCheck: async () => {
    return apiRequest('/health');
  },
};