import { Request, Response, NextFunction } from "express";
import * as appointmentService from "../services/appointmentService";
import { buildPagination } from "../utils/pagination";

export const getAllAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Campos permitidos para ordenar (podés ajustar)
    const pg = buildPagination(req.query, [
      "id",
      "date",
      "startTime",
      "endTime",
      "status",
      "createdAt",
    ]);

    const result = await appointmentService.getAllAppointments(pg);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await appointmentService.getAppointmentById(parseInt(req.params.id));
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await appointmentService.createAppointment(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // opcional en body: { cancelledBy: "owner" | "client" }
    const cancelledBy = (req.body?.cancelledBy === "owner" || req.body?.cancelledBy === "client")
      ? req.body.cancelledBy as "owner" | "client"
      : undefined;

    const item = await appointmentService.updateAppointment(parseInt(req.params.id), req.body, {
      actorCancelledBy: cancelledBy
    });
    res.json(item);
  } catch (error) { next(error); }
};

export const deleteAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await appointmentService.deleteAppointment(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};


export const getAppointmentsByServiceId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const list = await appointmentService.getAppointmentsByServiceId(serviceId);
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const getAllAppointmentsByUserIdAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId, 10);

    const pg = buildPagination(req.query, [
      "id",
      "date",
      "startTime",
      "endTime",
      "status",
      "createdAt",
      "updatedAt",
    ]);

    const result = await appointmentService.getAllAppointmentsByUserIdAll(userId, pg);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

