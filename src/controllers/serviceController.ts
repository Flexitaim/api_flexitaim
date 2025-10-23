import { Request, Response, NextFunction } from "express";
import * as serviceService from "../services/serviceService";
import { buildPagination } from "../utils/pagination";
import axios from "axios";
import { buildQrUrl } from "../utils/qrClient";
import { getServiceLink as getServiceLinkSvc } from "../services/serviceService";

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

const QR_BASE = process.env.QR_MS_BASE_URL || "http://localhost:3060/api/qr";

export const getServiceQrById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

    // 1) tomá el UUID que ya tenés
    const { link } = await getServiceLinkSvc(id);

    // 2) ESTE es el destino que querés codificar en el QR
    const data = `http://localhost:3000/api/services/${link}`;

    // 3) armá la URL al MS de QR
    const u = new URL(QR_BASE);
    u.searchParams.set("data", data);
    u.searchParams.set("format", (req.query.format as string) || "png");
    if (req.query.size)    u.searchParams.set("size",    String(req.query.size));
    if (req.query.margin)  u.searchParams.set("margin",  String(req.query.margin));
    if (req.query.eccLevel)u.searchParams.set("eccLevel",String(req.query.eccLevel));
    if (req.query.dark)    u.searchParams.set("dark",    String(req.query.dark));
    if (req.query.light)   u.searchParams.set("light",   String(req.query.light));

    // 4) si querés testear directo
    if (req.query.redirect === "1") return res.redirect(u.toString());

    // 5) pedí BINARIO (arraybuffer) y devolvelo tal cual
    const resp = await axios.get(u.toString(), { responseType: "arraybuffer", transformResponse: [] });

    // ⚠️ Content-Type sin charset
    const ct = (resp.headers["content-type"] || "image/png").split(";")[0];

    res.writeHead(200, {
      "Content-Type": ct,
      "Content-Length": resp.data.byteLength,      // ayuda a algunos navegadores
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Disposition": "inline; filename=service-qr.png"
    });

    // enviar el buffer crudo
    return res.end(Buffer.from(resp.data), "binary");
  } catch (err) {
    next(err);
  }
};
