// seeders/seed.ts
import sequelize from "../utils/databaseService";

// 📌 Registrar modelos ANTES de sync:
import "../models/User";
import "../models/Role";
import "../models/Category";
import "../models/PasswordResetToken"; // <- este faltaba

import seedCategories from "./categorySeeder";
import seedRoles from "./roleSeeder";
import seedUsers from "./userSeeder";

const seed = async () => {
  try {
    await sequelize.authenticate();

    // Opcional pero robusto en DEV: desactivar FKs para el reset
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await sequelize.sync({ force: true }); // recrea todo
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    await seedCategories();
    await seedRoles();
    await seedUsers();

    console.log("✅ Seed completado exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al ejecutar seed:", error);
    process.exit(1);
  }
};

seed();