import { pool } from '../config/db.js';

// 📝 Variable temporal para almacenar huellas pendientes de registro
let huellasPendientes = new Map();

// 📝 REGISTRAR HUELLA
const registrarHuella = async (req, res) => {
    try {
        const { finger_id, nombre } = req.body;
        
        // ✅ VALIDACIÓN DE CAMPOS OBLIGATORIOS
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo "nombre" es obligatorio'
            });
        }

        if (!finger_id) {
            return res.status(400).json({
                success: false,
                message: 'El campo "finger_id" es obligatorio'
            });
        }
        
        // Verificar si ya existe una huella con ese finger_id
        const checkSql = "SELECT * FROM huellas WHERE finger_id = $1";
        const { rows: existing } = await pool.query(checkSql, [finger_id]);
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una huella registrada con este ID'
            });
        }
        
        const sql = "INSERT INTO huellas (finger_id, nombre) VALUES ($1, $2) RETURNING *";
        const { rows: result } = await pool.query(sql, [finger_id, nombre.trim()]);
        
        // 📌 Eliminar de pendientes si estaba ahí
        huellasPendientes.delete(finger_id.toString());
        
        res.json({ 
            success: true, 
            message: 'Huella registrada correctamente',
            id: result[0].id 
        });
    } catch (error) {
        console.error('Error al registrar huella:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al registrar huella',
            error: error.message 
        });
    }
};

// 📋 LISTAR TODAS LAS HUELLAS
const listarHuellas = async (req, res) => {
    try {
        const sql = "SELECT * FROM huellas ORDER BY fecha_registro DESC";
        const { rows: results } = await pool.query(sql);
        
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (error) {
        console.error('Error al listar huellas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al listar huellas',
            error: error.message
        });
    }
};

// 🔍 VERIFICAR HUELLA
const verificarHuella = async (req, res) => {
    try {
        const { finger_id } = req.query;
        
        if (!finger_id) {
            return res.status(400).json({
                success: false,
                message: 'El parámetro "finger_id" es requerido'
            });
        }
        
        const sql = "SELECT * FROM huellas WHERE finger_id = $1";
        const { rows: results } = await pool.query(sql, [finger_id]);
        
        if (results.length > 0) {
            res.json({
                success: true,
                data: results[0],
                message: 'Huella encontrada'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Huella no registrada'
            });
        }
    } catch (error) {
        console.error('Error al verificar huella:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar huella',
            error: error.message
        });
    }
};

// 🆕 PREPARAR REGISTRO (llamado por el ESP32)
const prepararRegistro = async (req, res) => {
    try {
        const { finger_id } = req.body;
        
        if (!finger_id) {
            return res.status(400).json({
                success: false,
                message: 'El campo "finger_id" es requerido'
            });
        }
        
        // Verificar si ya está registrada
        const checkSql = "SELECT * FROM huellas WHERE finger_id = $1";
        const { rows: existing } = await pool.query(checkSql, [finger_id]);
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Esta huella ya está registrada'
            });
        }
        
        // 📌 Agregar a pendientes (expira en 5 minutos)
        huellasPendientes.set(finger_id.toString(), {
            finger_id: finger_id,
            timestamp: Date.now(),
            expires: Date.now() + (5 * 60 * 1000) // 5 minutos
        });
        
        console.log(`📢 Huella pendiente de registro: ${finger_id}`);
        
        res.json({
            success: true,
            message: 'Huella lista para registro',
            finger_id: finger_id
        });
    } catch (error) {
        console.error('Error al preparar registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al preparar registro',
            error: error.message
        });
    }
};

// 🔄 OBTENER REGISTROS PENDIENTES (llamado por el frontend)
const obtenerPendientes = async (req, res) => {
    try {
        // 🔄 Limpiar pendientes expirados
        const now = Date.now();
        for (const [key, value] of huellasPendientes.entries()) {
            if (value.expires < now) {
                huellasPendientes.delete(key);
            }
        }
        
        // Obtener el primer pendiente (si existe)
        const firstPending = huellasPendientes.size > 0 ? 
            Array.from(huellasPendientes.values())[0] : null;
        
        if (firstPending) {
            res.json({
                pendiente: true,
                finger_id: firstPending.finger_id,
                timestamp: firstPending.timestamp
            });
        } else {
            res.json({
                pendiente: false,
                message: 'No hay huellas pendientes'
            });
        }
    } catch (error) {
        console.error('Error al obtener pendientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pendientes',
            error: error.message
        });
    }
};

// 📊 OBTENER REGISTROS POR FECHA/HORA
const obtenerRegistrosPorHora = async (req, res) => {
    try {
        const { fecha } = req.query; // formato: YYYY-MM-DD
        
        let sql;
        let values = [];
        
        if (fecha) {
            // Filtrar por fecha específica
            sql = `
                SELECT * FROM huellas 
                WHERE DATE(fecha_registro) = $1
                ORDER BY fecha_registro DESC
            `;
            values = [fecha];
        } else {
            // Últimos 7 días por defecto
            sql = `
                SELECT * FROM huellas 
                WHERE fecha_registro >= NOW() - INTERVAL '7 days'
                ORDER BY fecha_registro DESC
            `;
        }
        
        const { rows: results } = await pool.query(sql, values);
        
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener registros',
            error: error.message
        });
    }
};

// 📤 EXPORTAR TODAS LAS FUNCIONES
export { 
    registrarHuella, 
    listarHuellas, 
    verificarHuella, 
    prepararRegistro, 
    obtenerPendientes,
    obtenerRegistrosPorHora
};