import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './database';

// Importar rutas
import authRoutes from './routes/auth';
import fincasRoutes from './routes/fincas';
import registrosRoutes from './routes/registros';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:40717'
  ], // Orígenes permitidos en desarrollo
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/fincas', fincasRoutes);
app.use('/api/registros', registrosRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Ruta no encontrada' 
  });
});

// Manejo de errores globales
app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next; // Evitar error de variable no utilizada manteniendo la firma de 4 argumentos
  console.error('Error no manejado:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor' 
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos. Cerrando servidor...');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📊 API disponible en http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();