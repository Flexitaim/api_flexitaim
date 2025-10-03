import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from "./middlewares/errorHandler";
dotenv.config();
import { initDatabase } from './utils/databaseService';
import userRouter from "./routes/userRouter";
import { setupAssociations } from './models/associations';
import serviceRouter from "./routes/serviceRouter";
import availabilityRouter from "./routes/availabilityRouter";
import appointmentRouter from "./routes/appointmentRouter";
import authRouter from "./routes/authRouter";
import categoryRouter from "./routes/categoryRouter";
import roleRouter from "./routes/roleRouter";
import cancellationRouter from "./routes/cancellationRouter";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./utils/swagger";
import paymentRouter from "./routes/paymentRouter";
import { loadSchemaLimits } from "./utils/schemaLimits";
import { enableStrictMode } from "./utils/sqlStrictMode";
import { attachLocalTimes } from "./middlewares/localTime";

const app = express();

const port = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(errorHandler);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use(attachLocalTimes());
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

async function initServer() {
  try {
    await initDatabase();
    await enableStrictMode();
    await loadSchemaLimits([
      "users",
      "services",
      "appointments",
      "availabilities",
      "cancellations",
      "categories",
      "payments",
      "roles"
    ]);

    setupAssociations();

    app.listen(port, () => {
      console.log(`⚡️[servidor]: Servidor corriendo en http://localhost:${port}`);
    });
  } catch (error) {
    console.error(`⚡️[servidor]: Error al iniciar el servidor: ${error}`);
  }
}

initServer();
