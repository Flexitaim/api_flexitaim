// src/services/availabilityService.ts
import { Availability, AvailabilityCreationAttributes } from "../models/Availability";
import { CreateAvailabilityDto, UpdateAvailabilityDto } from "../dtos/availability.dto";
import { ApiError } from "../utils/ApiError";
import { Service } from "../models/Service";
import {
  PaginationParams,
  PaginatedResult,
  buildPaginatedResult,
} from "../utils/pagination";
import { ymd } from "../utils/dateUtils";
import { normalizeStartDateWindow } from "../utils/availabilityDates"; // <-- NUEVO

export const getAllAvailabilities = async (
  pg: PaginationParams
): Promise<PaginatedResult<Availability>> => {
  const { limit, offset, order } = pg;

  const { rows, count } = await Availability.findAndCountAll({
    where: { active: true },
    limit,
    offset,
    order,
    distinct: true,
  });

  return buildPaginatedResult(rows, count, pg);
};

export const getAvailabilityById = async (id: number) => {
  const availability = await Availability.findOne({ where: { id, active: true } });
  if (!availability) throw new ApiError("Availability not found", 404);
  return availability;
};

export const getAvailabilityByServiceId = async (serviceId: number) => {
  const availability = await Availability.findAll({
    where: { serviceId, active: true }
  });
  return availability;
};

export const createAvailability = async (data: CreateAvailabilityDto) => {
  const service = await Service.findOne({ where: { id: data.serviceId, active: true } });
  if (!service) throw new ApiError("Service with the specified id does not exist", 404);

  // Normalizamos fechas a 'YYYY-MM-DD'
  const sd = ymd(data.startDate);
  const ed = ymd(data.endDate);

  // Ajuste inteligente del startDate al próximo día válido
  const adjustedStart = normalizeStartDateWindow(sd, ed, data.dayOfWeek, data.startTime);
  if (!adjustedStart) {
    throw new ApiError(
      "The provided date range has no upcoming valid occurrence for the selected day/time.",
      409
    );
  }

  const availabilityData: AvailabilityCreationAttributes = {
    serviceId: data.serviceId,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime:   data.endTime,
    startDate: adjustedStart, // 👈 usamos el ajustado
    endDate:   ed,
    active: true,
  };

  return await Availability.create(availabilityData);
};

export const updateAvailability = async (id: number, data: UpdateAvailabilityDto) => {
  const availability = await Availability.findOne({ where: { id, active: true } });
  if (!availability) throw new ApiError("Availability not found", 404);

  if (data.serviceId !== undefined && data.serviceId !== availability.serviceId) {
    const service = await Service.findOne({ where: { id: data.serviceId, active: true } });
    if (!service) throw new ApiError("Service with the specified id does not exist", 404);
  }

  const payload: Partial<AvailabilityCreationAttributes> = { ...data } as any;
  if (payload.startDate) payload.startDate = ymd(payload.startDate);
  if (payload.endDate)   payload.endDate   = ymd(payload.endDate);

  // (Opcional) Si cambian dayOfWeek/startTime/startDate, volvemos a ajustar:
  const willAdjust =
    (payload.startDate ?? availability.startDate) &&
    (payload.dayOfWeek ?? availability.dayOfWeek) !== undefined &&
    (payload.startTime ?? availability.startTime) !== undefined;

  if (willAdjust) {
    const baseStart   = payload.startDate ?? availability.startDate;
    const baseEnd     = payload.endDate   ?? availability.endDate;
    const baseDOW     = payload.dayOfWeek ?? availability.dayOfWeek;
    const baseStartTm = payload.startTime ?? availability.startTime;

    const adjusted = normalizeStartDateWindow(baseStart!, baseEnd!, baseDOW!, baseStartTm!);
    if (!adjusted) {
      throw new ApiError(
        "The updated window has no upcoming valid occurrence for the selected day/time.",
        409
      );
    }
    payload.startDate = adjusted;
  }

  await availability.update(payload);
  return availability;
};

export const deleteAvailability = async (id: number) => {
  const availability = await Availability.findOne({ where: { id, active: true } });
  if (!availability) throw new ApiError("Availability not found", 404);
  await availability.update({ active: false });
  return { message: "Availability disabled successfully" };
};
