import { Service, ServiceCreationAttributes } from "../models/Service";
import { CreateServiceDto, UpdateServiceDto } from "../dtos/service.dto";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/User";
import { Appointment } from "../models/Appointment";     
import sequelize from "../utils/databaseService";
import {
  PaginationParams,
  PaginatedResult,
  buildPaginatedResult,
} from "../utils/pagination";

export const getAllServices = async (
  pg: PaginationParams
): Promise<PaginatedResult<Service>> => {
  const { limit, offset, order } = pg;

  const { rows, count } = await Service.findAndCountAll({
    limit,
    offset,
    order,
    distinct: true, // por si en el futuro agregás include
  });

  return buildPaginatedResult(rows, count, pg);
};
export const getServiceById = async (id: number) => {
  const service = await Service.findOne({
    where: { id, active: true },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "lastName", "email", "cel"],
      },
    ],
  });

  if (!service) throw new ApiError("Service not found", 404);
  return service;
};


export const createService = async (data: CreateServiceDto) => {
  const serviceData: ServiceCreationAttributes = {
    ...data,
    active: true,
  };
  return await Service.create(serviceData);
};

export const updateService = async (id: number, data: UpdateServiceDto) => {
  const service = await Service.findOne({ where: { id, active: true } });
  if (!service) throw new ApiError("Service not found", 404);
  await service.update(data);
  return service;
};

export const deleteService = async (id: number) => {
  return await sequelize.transaction(async (t) => {
    const service = await Service.findOne({ where: { id, active: true }, transaction: t });
    if (!service) throw new ApiError("Service not found", 404);

    // 1) Desactivar el servicio
    await service.update({ active: false }, { transaction: t });

    // 2) Desactivar TODOS los turnos del servicio
    const [appointmentsDisabled] = await Appointment.update(
      { active: false },
      { where: { serviceId: id, active: true }, transaction: t }
    );

    return {
      message: "Service disabled successfully",
      appointmentsDisabled,  // para saber cuántos turnos se desactivaron
    };
  });
};

export const getServiceLink = async (id: number) => {
  const svc = await Service.findOne({
    where: { id, active: true },
    attributes: ["id", "link"],            
  });
  if (!svc) throw new ApiError("Service not found", 404);
  // podés devolver solo el link si preferís
  return { id: svc.id, link: svc.link };
};


export const getServiceByLink = async (link: string) => {
  const service = await Service.findOne({
    where: { link, active: true },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "lastName", "email", "cel"],
      },
    ],
  });

  if (!service) throw new ApiError("Service not found", 404);
  return service;
};

export const getServiceByUser = async (userId: number) => {
  const user = await User.findOne({ where: { id: userId, active: true } });
  if (!user) throw new ApiError("User not found", 404);

  return await Service.findAll({
    where: { userId },
    // si querés incluir datos del user:
    // include: [{ model: User, as: "user", attributes: ["id","name","lastName","email","cel"] }],
    order: [["createdAt", "DESC"]],
  });
};