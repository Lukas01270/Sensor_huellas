import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fingerprintRoutes from "./src/routes/fingerprintRoutes.js";
import "./src/config/db.js"; // 👈 Importa la conexión a la base de datos

const app = express();
app.use(express.json());

// Configuración para archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "src", "public")));

// Rutas API
app.use("/api", fingerprintRoutes);

// Ruta principal -> muestra index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "public", "index.html"));
});

export default app;
