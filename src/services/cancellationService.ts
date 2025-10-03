import sequelize from "../utils/databaseService";
import { Cancellation, CancellationCreationAttributes } from "../models/Cancellation";
import { CreateCancellationDto, UpdateCancellationDto } from "../dtos/cancellation.dto";
import { ApiError } from "../utils/ApiError";
import { Appointment } from "../models/Appointment";
import { Status } from "../enums/status.enum";
import {
  PaginationParams,
  PaginatedResult,
  buildPaginatedResult,
} from "../utils/pagination";

// ✅ GET ALL paginado
export const getAllCancellations = async (
  pg: PaginationParams
): Promise<PaginatedResult<Cancellation>> => {
  const { limit, offset, order } = pg;

  const { rows, count } = await Cancellation.findAndCountAll({
    where: { active: true },
    limit,
    offset,
    order,
    distinct: true, // por si en el futuro agregás include
  });

  return buildPaginatedResult(rows, count, pg);
};

export const getCancellationById = async (id: number) => {
  const cancellation = await Cancellation.findOne({ where: { id, active: true } });
  if (!cancellation) throw new ApiError("Cancellation not found", 404);
  return cancellation;
};

export const createCancellation = async (data: CreateCancellationDto) => {
  return await sequelize.transaction(async (t) => {
    // 1) Verificar que el turno exista y esté activo
    const appt = await Appointment.findOne({
      where: { id: data.appointmentId, active: true },
      transaction: t,
    });
    if (!appt) throw new ApiError("Appointment not found", 404);

    // 2) Poner el turno en AVAILABLE 
   
    await appt.update({ status: Status.AVAILABLE }, { transaction: t });

    // 3) Registrar la cancelación (soft=active: true)
    const payload: CancellationCreationAttributes = {
      appointmentId: data.appointmentId,
      active: true,
    };
    const created = await Cancellation.create(payload, { transaction: t });

    return created;
  });
};

export const updateCancellation = async (id: number, data: UpdateCancellationDto) => {
  const cancellation = await Cancellation.findOne({ where: { id, active: true } });
  if (!cancellation) throw new ApiError("Cancellation not found", 404);
  await cancellation.update(data);
  return cancellation;
};

export const deleteCancellation = async (id: number) => {
  const cancellation = await Cancellation.findOne({ where: { id, active: true } });
  if (!cancellation) throw new ApiError("Cancellation not found", 404);
  await cancellation.update({ active: false });
  return { message: "Cancellation disabled successfully" };
};
