// src/utils/databaseService.ts
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

// ❌ NO fuerces UTC acá
// process.env.TZ = 'UTC';   // <- quitá o comentá

export const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT!, 10),
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  logging: false,

  // ✅ Serialización en hora local AR para DATETIME
  timezone: "-03:00", // IMPORTANTE: Sequelize usa offset, no nombre de zona

  pool: { max: 5, min: 0, acquire: 60000, idle: 10000 },

  dialectOptions: {
    // ✅ mysql2 también en -03:00 (coherencia)
    timezone: "-03:00",
    dateStrings: true,
    typeCast: (field: any, next: any) => {
      if (field.type === "DATE") return field.string();
      if (field.type === "DATETIME") return field.string();
      if (field.type === "TIMESTAMP") return field.string();
      if (field.type === "TIME") return field.string();
      return next();
    },
  },
});

// 🔧 Zona por sesión MySQL en -03:00 (no uses '+00:00')
sequelize.addHook("afterConnect", async (connection: any) => {
  await new Promise<void>((resolve, reject) => {
    connection.query("SET time_zone = '-03:00'", (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
});

export const initDatabase = async () => {
  await sequelize.authenticate();
  await sequelize.query("SET time_zone = '-03:00'"); // para el pool actual

  console.log("✅ Conexión OK y time_zone=-03:00 en todas las conexiones");

  // NO crear ni modificar índices
  await sequelize.sync({ alter: false, force: false });
};

export default sequelize;
