import { Request, Response, NextFunction } from "express";
import * as availabilityService from "../services/availabilityService";
import { buildPagination } from "../utils/pagination";
import { ApiError } from "../utils/ApiError";

export const getAllAvailabilities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Campos permitidos para ordenar en Availability
    const pg = buildPagination(req.query, [
      "id",
      "dayOfWeek",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
      "createdAt",
    ]);

    const result = await availabilityService.getAllAvailabilities(pg);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAvailabilityById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await availabilityService.getAvailabilityById(parseInt(req.params.id));
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const getAvailabilityByServiceId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await availabilityService.getAvailabilityByServiceId(parseInt(req.params.serviceId));
    res.json(items);
  } catch (error) {
    next(error);
  }
};


export const createAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await availabilityService.createAvailability(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await availabilityService.updateAvailability(parseInt(req.params.id), req.body);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await availabilityService.deleteAvailability(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};


export const bulkCreateAvailabilities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mode = String(req.query.mode || "strict").toLowerCase() === "lenient" ? "lenient" : "strict";
    const result = await availabilityService.bulkCreateAvailabilities(req.body, { mode });

    // lenient siempre 201 (creó lo posible)
    // strict llega aquí solo si no hubo errores
    return res.status(201).json(result);
  } catch (error: any) {
    // Si viene del strict con 409, el message contiene el JSON del resultado
    if (error instanceof ApiError && error.statusCode === 409) {
      try {
        const parsed = JSON.parse(error.message);
        return res.status(409).json(parsed);
      } catch {
        // si por algún motivo no parsea, devuelvo el ApiError estándar
      }
    }
    next(error);
  }
};