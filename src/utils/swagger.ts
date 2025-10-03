const swaggerJSDoc = require("swagger-jsdoc");

export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Reservoz API",
      version: "1.0.0",
      description: "Documentación de la API para gestión de turnos",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Servidor local",
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/models/*.ts"], // donde están tus anotaciones
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
