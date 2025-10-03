import { Router } from "express";
import {
  getAllAvailabilities,
  getAvailabilityById,
  getAvailabilityByServiceId,
  createAvailability,
  updateAvailability,
  deleteAvailability,
} from "../controllers/availabilityController";
import { validate } from "../middlewares/validate";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import {
  createAvailabilitySchema,
  updateAvailabilitySchema,
} from "../validations/availability.validation";

const router = Router();

router.get("/",isAuthenticated, getAllAvailabilities);
router.get("/:id",isAuthenticated,getAvailabilityById);
router.get("/service/:serviceId", isAuthenticated, getAvailabilityByServiceId);

router.post("/", isAuthenticated,validate(createAvailabilitySchema), createAvailability);
router.put("/:id", isAuthenticated,validate(updateAvailabilitySchema), updateAvailability);
router.delete("/:id",isAuthenticated, deleteAvailability);

export default router;
