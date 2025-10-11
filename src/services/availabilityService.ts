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
import { Op, Transaction } from "sequelize";
import sequelize from "../utils/databaseService";

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

export type BulkMode = "strict" | "lenient";

type BulkError = {
  index: number;
  input: CreateAvailabilityDto;
  message: string;
  conflictWith?: any;
};

type BulkResult = {
  mode: BulkMode;
  total: number;
  createdCount: number;
  failedCount: number;
  created: Availability[];
  errors: BulkError[];
};

// ---------- helpers ----------
const timeToSecs = (t: string) => {
  const [h = 0, m = 0, s = 0] = t.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => {
  // 'YYYY-MM-DD' y 'HH:mm(:ss)' comparables lexicográficamente en SQL,
  // aquí usamos lógica estándar: overlap si start < otherEnd && end > otherStart
  return aStart <= bEnd && aEnd >= bStart;
};

const timesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => {
  return timeToSecs(aStart) < timeToSecs(bEnd) && timeToSecs(aEnd) > timeToSecs(bStart);
};

const findDbConflict = async (
  t: Transaction,
  item: { serviceId: number; dayOfWeek: number; startDate: string; endDate: string; startTime: string; endTime: string; }
) => {
  return await Availability.findOne({
    where: {
      active: true,
      serviceId: item.serviceId,
      dayOfWeek: item.dayOfWeek,
      // solapamiento de fecha
      startDate: { [Op.lte]: item.endDate },
      endDate:   { [Op.gte]: item.startDate },
      // solapamiento de hora
      startTime: { [Op.lt]:  item.endTime },
      endTime:   { [Op.gt]:  item.startTime },
    },
    transaction: t,
  });
};

// ---------- BULK CREATE ----------
export const bulkCreateAvailabilities = async (
  items: CreateAvailabilityDto[],
  opts?: { mode?: BulkMode }
): Promise<BulkResult> => {
  const mode: BulkMode = (opts?.mode ?? "strict").toLowerCase() === "lenient" ? "lenient" : "strict";

  if (!items?.length) {
    throw new ApiError("Empty payload", 400);
  }

  // Validamos servicios existentes de una sola vez
  const serviceIds = [...new Set(items.map(i => i.serviceId))];
  const services = await Service.findAll({ where: { id: { [Op.in]: serviceIds }, active: true } });
  const activeServiceIds = new Set(services.map(s => s.id));
  const missing = serviceIds.filter(id => !activeServiceIds.has(id));
  if (missing.length > 0 && mode === "strict") {
    throw new ApiError(`Some serviceIds do not exist or are inactive: ${missing.join(", ")}`, 404);
  }

  // Prevalidación intra-batch: normalizamos fechas y aplicamos ajuste inteligente
  const prepared = items.map((raw, index) => {
    const sd = ymd(raw.startDate);
    const ed = ymd(raw.endDate);
    const adjustedStart = normalizeStartDateWindow(sd, ed, raw.dayOfWeek, raw.startTime);
    return { index, raw, sd, ed, adjustedStart };
  });

  const errors: BulkError[] = [];
  const acceptedForInsert: Array<AvailabilityCreationAttributes & { __index: number }> = [];

  // transacción única para consistencia
  return await sequelize.transaction(async (t) => {
    // Validación por ítem (ajuste de fecha + conflictos DB + conflictos dentro del batch)
    for (const p of prepared) {
      const { raw } = p;

      // service activo (en lenient solo marca error en el item)
      if (!activeServiceIds.has(raw.serviceId)) {
        if (mode === "lenient") {
          errors.push({ index: p.index, input: raw, message: `Service ${raw.serviceId} not found or inactive` });
          continue;
        }
        // en strict lo hubiéramos cortado arriba
      }

      if (!p.adjustedStart) {
        if (mode === "lenient") {
          errors.push({
            index: p.index,
            input: raw,
            message: "The provided date range has no upcoming valid occurrence for the selected day/time."
          });
          continue;
        } else {
          errors.push({
            index: p.index,
            input: raw,
            message: "The provided date range has no upcoming valid occurrence for the selected day/time."
          });
          // seguimos para acumular todos los errores y luego abortar
          continue;
        }
      }

      const candidate: AvailabilityCreationAttributes & { __index: number } = {
        __index: p.index,
        serviceId: raw.serviceId,
        dayOfWeek: raw.dayOfWeek,
        startTime: raw.startTime,
        endTime:   raw.endTime,
        startDate: p.adjustedStart,
        endDate:   p.ed,
        active: true,
      };

      // Conflicto contra DB
      const dbConflict = await findDbConflict(t, {
        serviceId: candidate.serviceId,
        dayOfWeek: candidate.dayOfWeek,
        startDate: candidate.startDate!,
        endDate:   candidate.endDate!,
        startTime: candidate.startTime!,
        endTime:   candidate.endTime!,
      });

      if (dbConflict) {
        errors.push({
          index: p.index,
          input: raw,
          message: `Overlaps with existing availability id=${dbConflict.id}`,
          conflictWith: { id: dbConflict.id },
        });
        if (mode === "strict") continue; // en strict no insertamos este ni nadie si hay errores
        else continue; // en lenient, lo omitimos y seguimos
      }

      // Conflicto dentro del mismo batch (contra los ya aceptados)
      const inBatchConflict = acceptedForInsert.find((a) =>
        a.serviceId === candidate.serviceId &&
        a.dayOfWeek === candidate.dayOfWeek &&
        rangesOverlap(a.startDate!, a.endDate!, candidate.startDate!, candidate.endDate!) &&
        timesOverlap(a.startTime!, a.endTime!, candidate.startTime!, candidate.endTime!)
      );

      if (inBatchConflict) {
        errors.push({
          index: p.index,
          input: raw,
          message: `Overlaps with another item in this batch (index ${inBatchConflict.__index})`,
        });
        continue;
      }

      acceptedForInsert.push(candidate);
    }

    // Si strict y hubo errores → abortamos sin insertar
    if (mode === "strict" && errors.length > 0) {
      // rollback automático por throw dentro de la tx
      throw new ApiError(JSON.stringify({
        mode,
        total: items.length,
        createdCount: 0,
        failedCount: errors.length,
        created: [],
        errors,
      }), 409);
    }

    // Insertamos los aceptados
    const created: Availability[] = [];
    for (const payload of acceptedForInsert) {
      const { __index, ...toCreate } = payload;
      const row = await Availability.create(toCreate, { transaction: t });
      created.push(row);
    }

    return {
      mode,
      total: items.length,
      createdCount: created.length,
      failedCount: errors.length,
      created,
      errors,
    };
  });
};