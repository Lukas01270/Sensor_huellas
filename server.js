import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log(`✅ Conectado a PostgreSQL correctamente`);
  console.log(`📊 Lista de registros disponible en: /lista`);
});