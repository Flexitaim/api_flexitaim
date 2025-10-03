import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { UniqueConstraintError, ValidationError, ForeignKeyConstraintError } from "sequelize";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err && err.name === "ZodError") {
    const message =
      err.issues && Array.isArray(err.issues)
        ? err.issues.map((i: any) => i.message).join(", ")
        : "Validation error";
    return res.status(400).json({ message });
  }

  if (err && err.original && err.original.code === "ER_DATA_TOO_LONG") {
    const colMatch = /for column '(.+?)'/.exec(err.original.sqlMessage || "");
    const col = colMatch && colMatch[1] ? colMatch[1] : "field";
    return res.status(400).json({ message: `${col} is too long for column` });
  }

  if (
    err instanceof UniqueConstraintError ||
    (err && err.name === "SequelizeUniqueConstraintError") ||
    (err && err.original && err.original.code === "ER_DUP_ENTRY")
  ) {
    const field =
      err.errors && err.errors[0] && err.errors[0].path
        ? err.errors[0].path
        : err.original && /for key '(.+?)'/.exec(err.original.sqlMessage || "")?.[1] || "field";
    return res.status(409).json({ message: `${field} already in use` });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({ message: "Invalid reference" });
  }

  if (err instanceof ValidationError || (err && err.name === "SequelizeValidationError")) {
    const message =
      err.errors && Array.isArray(err.errors)
        ? err.errors.map((e: any) => e.message).join(", ")
        : "Validation error";
    return res.status(400).json({ message });
  }

  const status = err && err.status ? err.status : 500;
  const message = err && err.message ? err.message : "Internal Server Error";
  return res.status(status).json({ message });
};
