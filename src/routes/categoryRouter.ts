import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { validate } from "../middlewares/validate";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validation";

const router = Router();

router.get("/",  getAllCategories);
router.get("/:id",  getCategoryById);

router.post("/",  isAuthenticated,validate(createCategorySchema), createCategory);
router.put("/:id",  isAuthenticated,validate(updateCategorySchema), updateCategory);
router.delete("/:id", isAuthenticated, deleteCategory);

export default router;
