import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { validate } from "../middlewares/validate";
import { upsertFavoriteSchema } from "../validations/favorite.validation";
import {
  getFavoritesByUser,
  upsertActivate,
  softDelete,
} from "../controllers/favoriteController";

const router = Router();

router.get("/users/:userId", isAuthenticated, getFavoritesByUser);
router.post("/", isAuthenticated, validate(upsertFavoriteSchema), upsertActivate);
router.delete("/users/:userId/services/:serviceId", isAuthenticated, softDelete);

export default router;
