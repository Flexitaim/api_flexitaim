import { Service } from "../models/Service";

const seedService = async () => {
  await Service.bulkCreate([
    {
      userId: 1,
      name: "Peluquería",
      description: "Corte y peinado completo",
      duration: 60,
      price: 3500,
      categoryId:1,
      active: true
    },
    {
      userId: 1,
      name: "Manicura",
      description: "Manicura completa con esmalte",
      duration: 45,
      price: 2500,
      categoryId:2,
      active: true
    },
    {
      userId: 2,
      name: "Masaje descontracturante",
      description: "45 minutos con aceites esenciales",
      duration: 45,
      price: 4000,
      categoryId:1,
      active: true
    },
    {
      userId: 3,
      name: "Consulta médica",
      description: "Consulta general con historial",
      duration: 30,
      price: 5000,
      categoryId:3,
      active: true
    },
    {
      userId: 4,
      name: "Entrenamiento Personal",
      description: "Sesión con entrenador profesional",
      duration: 60,
      price: 4500,
      categoryId:1,
      active: true
    }
  ]);
};

export default seedService;
