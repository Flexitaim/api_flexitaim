// src/services/availabilityService.ts
import { Op, Transaction } from "sequelize";
import sequelize from "../utils/databaseService";
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
import { normalizeStartDateWindow } from "../utils/availabilityDates";

// =============================
// CRUD BÁSICO
// =============================
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
    startDate: adjustedStart,
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

  // Si cambian dayOfWeek/startTime/startDate, reajustamos al próximo día válido
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

// =============================
// BULK CREATE
// =============================
export type BulkMode = "strict" | "lenient";

// Tipo de error unificado para CREATE y UPDATE
export type BulkError = {
  index: number;
  message: string;
  // create: payload original
  input?: CreateAvailabilityDto;
  // update: id afectado
  id?: number;
  // detalle del conflicto
  conflictWith?: { id: number } | any;
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

const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart <= bEnd && aEnd >= bStart;

const timesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  timeToSecs(aStart) < timeToSecs(bEnd) && timeToSecs(aEnd) > timeToSecs(bStart);

const findDbConflict = async (
  t: Transaction,
  item: { serviceId: number; dayOfWeek: number; startDate: string; endDate: string; startTime: string; endTime: string; }
) => {
  return await Availability.findOne({
    where: {
      active: true,
      serviceId: item.serviceId,
      dayOfWeek: item.dayOfWeek,
      startDate: { [Op.lte]: item.endDate },
      endDate:   { [Op.gte]: item.startDate },
      startTime: { [Op.lt]:  item.endTime },
      endTime:   { [Op.gt]:  item.startTime },
    },
    transaction: t,
  });
};

export const bulkCreateAvailabilities = async (
  items: CreateAvailabilityDto[],
  opts?: { mode?: BulkMode }
): Promise<BulkResult> => {
  const mode: BulkMode = (opts?.mode ?? "strict").toLowerCase() === "lenient" ? "lenient" : "strict";
  if (!items?.length) throw new ApiError("Empty payload", 400);

  // Servicios válidos
  const serviceIds = [...new Set(items.map(i => i.serviceId))];
  const services = await Service.findAll({ where: { id: { [Op.in]: serviceIds }, active: true } });
  const activeServiceIds = new Set(services.map(s => s.id));
  const missing = serviceIds.filter(id => !activeServiceIds.has(id));
  if (missing.length > 0 && mode === "strict") {
    throw new ApiError(`Some serviceIds do not exist or are inactive: ${missing.join(", ")}`, 404);
  }

  // Pre-normalización + ajuste inteligente
  const prepared = items.map((raw, index) => {
    const sd = ymd(raw.startDate);
    const ed = ymd(raw.endDate);
    const adjustedStart = normalizeStartDateWindow(sd, ed, raw.dayOfWeek, raw.startTime);
    return { index, raw, sd, ed, adjustedStart };
  });

  const errors: BulkError[] = [];
  const acceptedForInsert: Array<AvailabilityCreationAttributes & { __index: number }> = [];

  return await sequelize.transaction(async (t) => {
    for (const p of prepared) {
      const { raw } = p;

      if (!activeServiceIds.has(raw.serviceId)) {
        if (mode === "lenient") {
          errors.push({ index: p.index, input: raw, message: `Service ${raw.serviceId} not found or inactive` });
          continue;
        }
      }

      if (!p.adjustedStart) {
        errors.push({
          index: p.index,
          input: raw,
          message: "The provided date range has no upcoming valid occurrence for the selected day/time."
        });
        continue;
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
        continue;
      }

      // Conflicto intra-batch
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

    if (mode === "strict" && errors.length > 0) {
      throw new ApiError(JSON.stringify({
        mode,
        total: items.length,
        createdCount: 0,
        failedCount: errors.length,
        created: [],
        errors,
      }), 409);
    }

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

// =============================
// BULK UPDATE
// =============================
export type BulkUpdateItem = {
  id: number;
  serviceId?: number;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
};

type BulkUpdateResult = {
  mode: "strict" | "lenient";
  total: number;
  updatedCount: number;
  failedCount: number;
  updated: Availability[];
  errors: BulkError[];
};

export const bulkUpdateAvailabilities = async (
  items: BulkUpdateItem[],
  opts?: { mode?: "strict" | "lenient" }
): Promise<BulkUpdateResult> => {
  const mode = (opts?.mode ?? "strict").toLowerCase() === "lenient" ? "lenient" : "strict";
  if (!items?.length) throw new ApiError("Empty payload", 400);

  // Cargamos todas las rows a actualizar
  const ids = [...new Set(items.map(i => i.id))];
  const rows = await Availability.findAll({ where: { id: { [Op.in]: ids }, active: true } });
  const map = new Map(rows.map(r => [r.id, r]));

  // Validamos services requeridos (si cambian)
  const serviceIds = [...new Set(items.map(i => i.serviceId).filter(Boolean) as number[])];
  const services = await Service.findAll({ where: { id: { [Op.in]: serviceIds }, active: true } });
  const activeServiceIds = new Set(services.map(s => s.id));

  const errors: BulkError[] = [];

  type Candidate = {
    __index: number;
    id: number;
    serviceId: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    startDate: string;
    endDate: string;
  };
  const candidates: Candidate[] = [];

  // Preparamos payloads finales
  for (let i = 0; i < items.length; i++) {
    const inItem = items[i];
    const current = map.get(inItem.id);
    if (!current) {
      errors.push({ index: i, id: inItem.id, message: "Availability not found or inactive" });
      continue;
    }

    // validar service si cambia
    const newServiceId = inItem.serviceId ?? current.serviceId;
    if (inItem.serviceId && !activeServiceIds.has(inItem.serviceId)) {
      errors.push({ index: i, id: inItem.id, message: `Service ${inItem.serviceId} not found or inactive` });
      continue;
    }

    const payload = {
      id: current.id,
      serviceId: newServiceId,
      dayOfWeek: inItem.dayOfWeek ?? current.dayOfWeek,
      startTime: inItem.startTime ?? current.startTime,
      endTime:   inItem.endTime   ?? current.endTime,
      startDate: ymd(inItem.startDate ?? current.startDate),
      endDate:   ymd(inItem.endDate   ?? current.endDate),
    };

    // Reajuste inteligente si cambian día/hora/fecha inicial
    const willAdjust =
      (inItem.startDate !== undefined || inItem.dayOfWeek !== undefined || inItem.startTime !== undefined);

    if (willAdjust) {
      const adjusted = normalizeStartDateWindow(
        payload.startDate,
        payload.endDate,
        payload.dayOfWeek,
        payload.startTime
      );
      if (!adjusted) {
        errors.push({
          index: i,
          id: inItem.id,
          message: "The updated window has no upcoming valid occurrence for the selected day/time."
        });
        continue;
      }
      payload.startDate = adjusted;
    }

    candidates.push({ __index: i, ...payload });
  }

  // Tx: conflictos + updates
  return await sequelize.transaction(async (t) => {
    // Conflictos con DB (excluyendo el propio id)
    for (const c of candidates) {
      const conflict = await Availability.findOne({
        where: {
          active: true,
          serviceId: c.serviceId,
          dayOfWeek: c.dayOfWeek,
          id: { [Op.ne]: c.id },
          startDate: { [Op.lte]: c.endDate },
          endDate:   { [Op.gte]: c.startDate },
          startTime: { [Op.lt]:  c.endTime },
          endTime:   { [Op.gt]:  c.startTime },
        },
        transaction: t,
      });
      if (conflict) {
        errors.push({
          index: c.__index,
          id: c.id,
          message: `Overlaps with existing availability id=${conflict.id}`,
          conflictWith: { id: conflict.id },
        });
      }
    }

    // Conflictos intra-batch
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i], b = candidates[j];
        if (
          a.serviceId === b.serviceId &&
          a.dayOfWeek === b.dayOfWeek &&
          rangesOverlap(a.startDate, a.endDate, b.startDate, b.endDate) &&
          timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)
        ) {
          errors.push({
            index: b.__index,
            id: b.id,
            message: `Overlaps with another item in this batch (index ${a.__index})`,
          });
        }
      }
    }

    if (mode === "strict" && errors.length > 0) {
      throw new ApiError(JSON.stringify({
        mode,
        total: items.length,
        updatedCount: 0,
        failedCount: errors.length,
        updated: [],
        errors,
      }), 409);
    }

    // Ejecutar updates (lenient: omite los con error)
    const errorIndexes = new Set(errors.map(e => e.index));
    const updated: Availability[] = [];
    for (const c of candidates) {
      if (errorIndexes.has(c.__index)) continue;
      const row = map.get(c.id)!;
      await row.update({
        serviceId: c.serviceId,
        dayOfWeek: c.dayOfWeek,
        startTime: c.startTime,
        endTime:   c.endTime,
        startDate: c.startDate,
        endDate:   c.endDate,
      }, { transaction: t });
      updated.push(row);
    }

    return {
      mode,
      total: items.length,
      updatedCount: updated.length,
      failedCount: errors.length,
      updated,
      errors,
    };
  });
};
