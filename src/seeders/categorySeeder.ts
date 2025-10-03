import { Category } from "../models/Category";

const seedCategory = async () => {
  await Category.bulkCreate([
    { description: "Salud", active: true },
    { description: "Fitness", active: true },
    { description: "Educación", active: true },
    { description: "Terapias", active: true },
    { description: "Masajes", active: true },
    { description: "Consultorías", active: true },
    { description: "Psicología", active: true },
    { description: "Estética y Belleza", active: true },
    { description: "Yoga y Pilates", active: true },
    { description: "Otro", active: true }
  ]);
};

export default seedCategory;