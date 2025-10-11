import { Router } from "express";
import {
  getAllAvailabilities,
  getAvailabilityById,
  getAvailabilityByServiceId,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  bulkCreateAvailabilities,
} from "../controllers/availabilityController";
import { validate } from "../middlewares/validate";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import {
  createAvailabilitySchema,
  updateAvailabilitySchema,
  bulkCreateAvailabilitySchema,
} from "../validations/availability.validation";

const router = Router();

router.get("/",isAuthenticated, getAllAvailabilities);
router.get("/:id",isAuthenticated,getAvailabilityById);
router.get("/service/:serviceId", isAuthenticated, getAvailabilityByServiceId);

router.post("/", isAuthenticated,validate(createAvailabilitySchema), createAvailability);
router.put("/:id", isAuthenticated,validate(updateAvailabilitySchema), updateAvailability);
router.delete("/:id", isAuthenticated, deleteAvailability);


// ?mode=strict|lenient  (default: strict)
router.post("/bulk", validate(bulkCreateAvailabilitySchema), bulkCreateAvailabilities);

export default router;
