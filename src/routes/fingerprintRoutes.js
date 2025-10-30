import express from "express";
import { 
    registrarHuella, 
    listarHuellas, 
    verificarHuella, 
    prepararRegistro, 
    obtenerPendientes,
    obtenerRegistrosPorHora
} from "../controllers/fingerprintController.js";

const router = express.Router();

// 📋 Obtener todas las huellas
router.get("/fingerprint", listarHuellas);

// 📝 Registrar nueva huella
router.post("/fingerprint", registrarHuella);

// 🔍 Verificar huella
router.get("/fingerprint/verificar", verificarHuella);

// 🆕 PREPARAR REGISTRO (ESP32 → Servidor)
router.post("/fingerprint/preparar-registro", prepararRegistro);

// 🔄 OBTENER PENDIENTES (Frontend → Servidor)
router.get("/fingerprint/pendientes", obtenerPendientes);

// 📊 OBTENER REGISTROS POR FECHA/HORA
router.get("/fingerprint/registros", obtenerRegistrosPorHora);

export default router;