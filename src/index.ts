import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { errorHandler } from "./middlewares/errorHandler";
import { initDatabase } from './utils/databaseService';
import { enableStrictMode } from "./utils/sqlStrictMode";
import { loadSchemaLimits } from "./utils/schemaLimits";
import { attachLocalTimes } from "./middlewares/localTime";

import userRouter from "./routes/userRouter";
import serviceRouter from "./routes/serviceRouter";
import availabilityRouter from "./routes/availabilityRouter";
import appointmentRouter from "./routes/appointmentRouter";
import authRouter from "./routes/authRouter";
import categoryRouter from "./routes/categoryRouter";
import roleRouter from "./routes/roleRouter";
import cancellationRouter from "./routes/cancellationRouter";
import paymentRouter from "./routes/paymentRouter";
import favoriteRouter from "./routes/favoriteRouter";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./utils/swagger";

const app = express();
const port = process.env.PORT || 10000;

// Middlewares “normales”
app.use(cors());
app.use(express.json());
app.use(attachLocalTimes());

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use("/api/users", userRouter);
app.use("/api/services", serviceRouter);
app.use("/api/availabilities", availabilityRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/roles", roleRouter);
app.use("/api/cancellations", cancellationRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/favorites", favoriteRouter);

// 404 JSON (opcional pero recomendado)
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// ⬇️ ¡EL HANDLER DE ERRORES SIEMPRE AL FINAL!
app.use(errorHandler);

async function initServer() {
  try {
    await initDatabase();
    await enableStrictMode();
    await loadSchemaLimits([
      "users","services","appointments","availabilities","cancellations",
      "categories","payments","roles","favorites"
    ]);

    // setupAssociations(); // (dejalo donde lo tenías)
    app.listen(port, () => console.log(`⚡️ Server on http://localhost:${port}`));
  } catch (error) {
    console.error(`⚡️ Error al iniciar:`, error);
  }
}

initServer();
