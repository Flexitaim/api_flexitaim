import { Request, Response, NextFunction } from "express";
import * as availabilityService from "../services/availabilityService";
import { buildPagination } from "../utils/pagination";

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
