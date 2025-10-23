import { Request, Response, NextFunction } from "express";
import * as favoriteService from "../services/favoriteService";
import { buildPagination } from "../utils/pagination";
import { upsertFavoriteSchema } from "../validations/favorite.validation";
import { ApiError } from "../utils/ApiError";

const parseId = (raw: any, field = "id") => {
  const v = parseInt(String(raw), 10);
  if (Number.isNaN(v) || v <= 0) throw new ApiError(`Invalid ${field}`, 400);
  return v;
};

export const getFavoritesByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseId(req.params.userId, "userId");
    const pg = buildPagination(req.query, ["id", "serviceId", "createdAt"]);
    const result = await favoriteService.getFavoritesByUser(userId, pg);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const upsertActivate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, serviceId } = upsertFavoriteSchema.parse(req.body);
    const result = await favoriteService.upsertActivate(userId, serviceId);
    res.status(result.created ? 201 : 200).json(result);
  } catch (err) {
    next(err);
  }
};

export const softDelete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseId(req.params.userId, "userId");
    const serviceId = parseId(req.params.serviceId, "serviceId");
    const result = await favoriteService.softDelete(userId, serviceId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
