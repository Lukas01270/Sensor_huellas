import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const db = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sensor_huellas",
  port: process.env.MYSQLPORT || 3306,
});

console.log("✅ Conectado a la base de datos MySQL");
