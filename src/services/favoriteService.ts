import sequelize from "../utils/databaseService";
import { ApiError } from "../utils/ApiError";
import { Favorite } from "../models/Favorite";
import { User } from "../models/User";
import { Service } from "../models/Service";
import {
  PaginationParams,
  PaginatedResult,
  buildPaginatedResult,
} from "../utils/pagination";

export const getFavoritesByUser = async (
  userId: number,
  pg: PaginationParams
): Promise<PaginatedResult<Favorite>> => {
  const exists = await User.findOne({ where: { id: userId, active: true } });
  if (!exists) throw new ApiError("User not found", 404);

  const { limit, offset, order } = pg;

  const { rows, count } = await Favorite.findAndCountAll({
    where: { userId, active: true },
    include: [
      {
        model: Service,
        as: "service",
        attributes: ["id", "userId", "name", "description", "duration", "price", "categoryId", "link", "active", "createdAt"],
        where: { active: true },
        required: true,
      },
    ],
    limit,
    offset,
    order: order?.length ? order : [["createdAt", "DESC"]],
    distinct: true,
  });

  // ⬇️ Nueva validación: si no hay favoritos para ese usuario, 404
  if (count === 0) {
    throw new ApiError("Favorites not found", 404);
  }

  // Si hay favoritos, respetamos la paginación (aunque esta página puntual pudiera venir vacía por offset alto)
  return buildPaginatedResult(rows, count, pg);
};

export const upsertActivate = async (userId: number, serviceId: number) => {
  const [user, service] = await Promise.all([
    User.findOne({ where: { id: userId, active: true } }),
    Service.findOne({ where: { id: serviceId, active: true } }),
  ]);
  if (!user) throw new ApiError("User not found", 404);
  if (!service) throw new ApiError("Service not found", 404);

  return await sequelize.transaction(async (t) => {
    const existing = await Favorite.findOne({
      where: { userId, serviceId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!existing) {
      const created = await Favorite.create({ userId, serviceId, active: true }, { transaction: t });
      return { created: true, reactivated: false, favorite: created };
    }

    if (existing.active) {
      return { created: false, reactivated: false, favorite: existing };
    }

    await existing.update({ active: true }, { transaction: t });
    return { created: false, reactivated: true, favorite: existing };
  });
};

export const softDelete = async (userId: number, serviceId: number) => {
  const fav = await Favorite.findOne({ where: { userId, serviceId, active: true } });
  if (!fav) throw new ApiError("Favorite not found", 404);

  await fav.update({ active: false });
  return { message: "Favorite disabled successfully" };
};
