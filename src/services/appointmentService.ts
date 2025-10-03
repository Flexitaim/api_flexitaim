import { Appointment, AppointmentCreationAttributes } from "../models/Appointment";
import { Status } from "../enums/status.enum";
import { CreateAppointmentDto, UpdateAppointmentDto } from "../dtos/appointment.dto";
import { ApiError } from "../utils/ApiError";
import { Op } from "sequelize";
import { Service } from "../models/Service";
import {
  PaginationParams,
  PaginatedResult,
  buildPaginatedResult,
} from "../utils/pagination";



function toDateOnlyString(input: string | Date): string {
  // Si ya viene 'YYYY-MM-DD', lo aceptamos
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) throw new ApiError("Invalid date", 400);

  // Formateo en hora local para evitar el shift de toISOString()
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}




export const getAllAppointments = async (
  pg: PaginationParams
): Promise<PaginatedResult<Appointment>> => {
  const { limit, offset, order } = pg;

  const { rows, count } = await Appointment.findAndCountAll({
    where: { active: true },
    limit,
    offset,
    order,
    // distinct evita conteos inflados si en el futuro agregás include
    distinct: true,
  });

  return buildPaginatedResult(rows, count, pg);
};
export const getAppointmentById = async (id: number) => {
  const appointment = await Appointment.findOne({ where: { id, active: true } });
  if (!appointment) throw new ApiError("Appointment not found", 404);
  return appointment;
};

export const createAppointment = async (data: CreateAppointmentDto) => {
  const date = toDateOnlyString(data.date); // <- string 'YYYY-MM-DD'

  const overlapping = await Appointment.findOne({
    where: {
      serviceId: data.serviceId,
      date,                   // <- string, porque DATEONLY
      active: true,
      [Op.and]: [
        { startTime: { [Op.lt]: data.endTime } },
        { endTime:   { [Op.gt]: data.startTime } },
      ],
    },
  });

  if (overlapping) throw new ApiError("Ya existe un turno en ese horario", 409);

  const appointmentData: AppointmentCreationAttributes = {
    ...data,
    userId: Number(data.userId),  // lo dejás number
    date,                         // string 'YYYY-MM-DD'
    status: data.status ?? Status.AVAILABLE,
    active: true,
  };

  return await Appointment.create(appointmentData);
};

export const updateAppointment = async (id: number, data: UpdateAppointmentDto) => {
  const appointment = await Appointment.findOne({ where: { id, active: true } });
  if (!appointment) throw new ApiError("Appointment not found", 404);

  const newDate = data.date ? toDateOnlyString(data.date) : appointment.date; // <- string
  const newStartTime = data.startTime ?? appointment.startTime;
  const newEndTime   = data.endTime   ?? appointment.endTime;
  const newServiceId = data.serviceId ?? appointment.serviceId;

  const overlapping = await Appointment.findOne({
    where: {
      serviceId: newServiceId,
      date: newDate,            // <- string
      active: true,
      id: { [Op.ne]: id },
      [Op.and]: [
        { startTime: { [Op.lt]: newEndTime } },
        { endTime:   { [Op.gt]: newStartTime } },
      ],
    },
  });

  if (overlapping) throw new ApiError("There is already an appointment for this service in that time slot", 400);

  await appointment.update({
    ...data,
    date: newDate,              // <- string
  } as Partial<AppointmentCreationAttributes>);

  return appointment;
};

export const deleteAppointment = async (id: number) => {
  const appointment = await Appointment.findOne({ where: { id, active: true } });
  if (!appointment) throw new ApiError("Appointment not found", 404);
  await appointment.update({ active: false });
  return { message: "Appointment disabled successfully" };
};

export const getAppointmentsByServiceId = async (serviceId: number) => {
  const service = await Service.findOne({ where: { id: serviceId, active: true } });
  if (!service) {
    throw new ApiError("Service with the specified id does not exist", 404);
  }

  return await Appointment.findAll({
    where: { serviceId, active: true },
  });
};


export const getAllAppointmentsByUserIdAll = async (
  userId: number,
  pg: PaginationParams
): Promise<PaginatedResult<Appointment>> => {
  const { limit, offset, order } = pg;

  const { rows, count } = await Appointment.findAndCountAll({
    where: { userId },          // ← sin filtro de active
    limit,
    offset,
    order,
    distinct: true,
  });

  return buildPaginatedResult(rows, count, pg);
};