import { Category, CategoryCreationAttributes } from "../models/Category";
import { CreateCategoryDto, UpdateCategoryDto } from "../dtos/category.dto";
import { ApiError } from "../utils/ApiError";

export const getAllCategories = async () => {
  return await Category.findAll({ where: { active: true } });
};

export const getCategoryById = async (id: number) => {
  const category = await Category.findOne({
    where: { id, active: true },
  });

  if (!category) {
    throw new ApiError("Category not found", 404);
  }

  return category;
};

export const createCategory = async (data: CreateCategoryDto) => {
  const categoryData: CategoryCreationAttributes = {
    description: data.description,
    active: true, // por defecto true
  };
  return await Category.create(categoryData);
};

export const updateCategory = async (id: number, data: UpdateCategoryDto) => {
  const category = await Category.findOne({ where: { id, active: true } });
  if (!category) {
    throw new ApiError("Category not found", 404);
  }

  await category.update(data);
  return category;
};

export const deleteCategory = async (id: number) => {
  const category = await Category.findOne({ where: { id, active: true } });
  if (!category) {
    throw new ApiError("Category not found", 404);
  }

  await category.update({ active: false });
  return { message: "Category disabled successfully" };
};
