import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../utils/databaseService";
import { attachDbLengthValidator } from "../utils/lengthValidator";

export interface FavoriteAttributes {
  id: number;
  userId: number;
  serviceId: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FavoriteCreationAttributes
  extends Optional<FavoriteAttributes, "id" | "active" | "createdAt" | "updatedAt"> {}

export class Favorite extends Model<FavoriteAttributes, FavoriteCreationAttributes>
  implements FavoriteAttributes {
  public id!: number;
  public userId!: number;
  public serviceId!: number;
  public active!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Favorite.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    serviceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    modelName: "Favorite",
    tableName: "favorites",
    timestamps: true,
    indexes: [
      { name: "uniq_favorites_user_service", unique: true, fields: ["userId", "serviceId"] },
      { name: "idx_favorites_user_active", fields: ["userId", "active"] },
      { name: "idx_favorites_service_active", fields: ["serviceId", "active"] },
    ],
  }
);

attachDbLengthValidator(Favorite as any, "favorites");
export default Favorite;
