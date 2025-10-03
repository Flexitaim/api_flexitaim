import { Router } from "express";
import {
  getAllServices,
  getServiceById,
  getServiceByUser,   
  createService,
  updateService,
  deleteService,
  getServiceLink,
  getServiceByLink,
} from "../controllers/serviceController";
import { validate } from "../middlewares/validate";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../validations/service.validation";
import { isAuthenticated } from "../middlewares/isAuthenticated";
const router = Router();

router.get("/", isAuthenticated,getAllServices);

router.get("/:id/link",isAuthenticated, getServiceLink);
router.get("/id/:id",isAuthenticated, getServiceById);


router.get("/user/:id",isAuthenticated, getServiceByUser);

router.get("/:link", isAuthenticated,getServiceByLink);

router.post("/", isAuthenticated,validate(createServiceSchema), createService);
router.put("/:id", isAuthenticated,validate(updateServiceSchema), updateService);
router.delete("/:id", isAuthenticated,deleteService);

export default router;