import express from 'express';
import type { Request, Response } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { executeQuery } from '../database';

const router = express.Router();

// Obtener todas las fincas
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = 'SELECT id, nombre, ubicacion, vereda, propietario FROM finca ORDER BY nombre';
    const results = await executeQuery(query);

    res.json({ 
      success: true, 
      fincas: results 
    });

  } catch (error) {
    console.error('Error obteniendo fincas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Obtener finca por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = 'SELECT * FROM finca WHERE id = ?';
    const results = await executeQuery(query, [id]) as RowDataPacket[];

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Finca no encontrada' 
      });
    }

    res.json({ 
      success: true, 
      finca: results[0] 
    });

  } catch (error) {
    console.error('Error obteniendo finca:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Crear nueva finca (opcional)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nombre, ubicacion, vereda, propietario } = req.body;

    if (!nombre) {
      return res.status(400).json({ 
        success: false, 
        message: 'El nombre de la finca es requerido' 
      });
    }

    const query = 'INSERT INTO finca (nombre, ubicacion, vereda, propietario) VALUES (?, ?, ?, ?)';
    const result = await executeQuery(query, [nombre, ubicacion || null, vereda || null, propietario || null]) as ResultSetHeader;

    res.status(201).json({ 
      success: true, 
      message: 'Finca creada exitosamente',
      fincaId: result.insertId 
    });

  } catch (error) {
    console.error('Error creando finca:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

export default router;