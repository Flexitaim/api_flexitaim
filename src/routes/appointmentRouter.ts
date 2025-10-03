import { Router } from "express";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByServiceId,
  getAllAppointmentsByUserIdAll
} from "../controllers/appointmentController";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { validate } from "../middlewares/validate";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from "../validations/appointment.validation";

const router = Router();

router.get('/by-service/:serviceId', isAuthenticated, getAppointmentsByServiceId);
router.get("/by-user/:userId/",isAuthenticated, getAllAppointmentsByUserIdAll);

router.get("/", isAuthenticated,getAllAppointments);
router.get("/:id",isAuthenticated, getAppointmentById);

router.post("/",isAuthenticated, validate(createAppointmentSchema), createAppointment);
router.put("/:id", isAuthenticated,validate(updateAppointmentSchema), updateAppointment);
router.delete("/:id", isAuthenticated,deleteAppointment);

export default router;

