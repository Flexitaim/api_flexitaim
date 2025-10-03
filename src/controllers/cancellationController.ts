import { Request, Response, NextFunction } from "express";
import * as cancellationService from "../services/cancellationService";
import { buildPagination } from "../utils/pagination";

export const getAllCancellations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Campos permitidos para ordenar
    const pg = buildPagination(req.query, ["id", "appointmentId", "createdAt", "updatedAt"]);
    const result = await cancellationService.getAllCancellations(pg);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCancellationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await cancellationService.getCancellationById(parseInt(req.params.id));
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createCancellation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await cancellationService.createCancellation(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateCancellation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await cancellationService.updateCancellation(parseInt(req.params.id), req.body);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteCancellation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await cancellationService.deleteCancellation(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};
