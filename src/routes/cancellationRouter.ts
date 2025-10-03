import { Router } from "express";
import {
  getAllCancellations,
  getCancellationById,
  createCancellation,
  updateCancellation,
  deleteCancellation,
} from "../controllers/cancellationController";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { validate } from "../middlewares/validate";
import {
  createCancellationSchema,
  updateCancellationSchema,
} from "../validations/cancellation.validation";

const router = Router();

router.get("/", isAuthenticated,getAllCancellations);
router.get("/:id",isAuthenticated,  getCancellationById);

router.post("/", isAuthenticated,validate(createCancellationSchema), createCancellation);
router.put("/:id", isAuthenticated,validate(updateCancellationSchema), updateCancellation);
router.delete("/:id", isAuthenticated, deleteCancellation);

export default router;

