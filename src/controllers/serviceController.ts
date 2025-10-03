import { Request, Response, NextFunction } from "express";
import * as serviceService from "../services/serviceService";
import { buildPagination } from "../utils/pagination";

export const getAllServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Campos permitidos para ordenar en Service
    const pg = buildPagination(req.query, [
      "id",
      "name",
      "price",
      "duration",
      "categoryId",
      "createdAt",
    ]);

    const result = await serviceService.getAllServices(pg);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getServiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await serviceService.getServiceById(parseInt(req.params.id));
    res.json(service);
  } catch (error) {
    next(error);
  }
};



export const getServiceByLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { link } = req.params;
    const service = await serviceService.getServiceByLink(link);
    res.json(service);
  } catch (error) {
    next(error);
  }
};

export const createService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await serviceService.createService(req.body);
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await serviceService.updateService(parseInt(req.params.id), req.body);
    res.json(service);
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await serviceService.deleteService(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
};


export const getServiceLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const data = await serviceService.getServiceLink(id);
    res.json(data); // { id, link }
  } catch (error) {
    next(error);
  }
};

export const getServiceByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const items = await serviceService.getServiceByUser(userId);
    res.json(items); 
  } catch (error) {
    next(error);
  }
};