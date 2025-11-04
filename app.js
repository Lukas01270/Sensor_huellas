import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fingerprintRoutes from "./src/routes/fingerprintRoutes.js";
import { db } from "./src/config/db.js"; // 👈 Importa la conexión a la base de datos

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

// 📊 NUEVA RUTA: Página para ver registros en tiempo real (AGREGA ESTO)
app.get("/lista", async (req, res) => {
  try {
    const [registros] = await db.execute(`
      SELECT * FROM huellas 
      ORDER BY fecha_registro DESC
    `);
    
    let html = `
      <html>
        <head>
          <title>Registros de Huellas - Tiempo Real</title>
          <meta http-equiv="refresh" content="15">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              background-color: #f5f5f5;
            }
            .container {
              max-width: 900px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { 
              color: #333; 
              text-align: center;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin: 20px 0;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background-color: #4CAF50; 
              color: white; 
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            .info {
              background: #e7f3ff;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📊 Registros de Huellas - Tiempo Real</h1>
            <div class="info">
              <strong>Total registros:</strong> ${registros.length} | 
              <strong>Última actualización:</strong> ${new Date().toLocaleString()}
            </div>
            <table>
              <tr>
                <th>ID</th>
                <th>Huella ID</th>
                <th>Nombre</th>
                <th>Fecha y Hora</th>
              </tr>
    `;
    
    if (registros.length === 0) {
      html += `
              <tr>
                <td colspan="4" style="text-align: center;">No hay registros aún</td>
              </tr>
      `;
    } else {
      registros.forEach(registro => {
        html += `
              <tr>
                <td>${registro.id}</td>
                <td>${registro.finger_id}</td>
                <td>${registro.nombre}</td>
                <td>${registro.fecha_registro || 'Recién registrado'}</td>
              </tr>
        `;
      });
    }
    
    html += `
            </table>
            <p><em>Esta página se actualiza automáticamente cada 15 segundos</em></p>
          </div>
        </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error en /lista:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>Error al cargar los datos</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});

export default app;
