import app from "./app.js";
import dotenv from "dotenv";

// Cargar variables del archivo .env (solo en local)
dotenv.config();

// Railway asigna automáticamente un puerto en la variable PORT
const PORT = process.env.PORT || 3000;

// Escuchar en todas las interfaces de red (importante para Railway)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
