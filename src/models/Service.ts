import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../utils/databaseService";
import { attachDbLengthValidator } from "../utils/lengthValidator";


interface ServiceAttributes {
  id: number;
  userId: number;
  name: string;
  description?: string;
  duration: number;
  price: number;
  categoryId: number;
  active: boolean;
  link: string;           
  createdAt?: Date;
  updatedAt?: Date;
}

interface ServiceCreationAttributes
  extends Optional<ServiceAttributes, "id" | "description" | "active" | "createdAt" | "updatedAt" | "link"> {}

export class Service extends Model<ServiceAttributes, ServiceCreationAttributes> implements ServiceAttributes {
  public id!: number;
  public userId!: number;
  public name!: string;
  public description?: string;
  public duration!: number;
  public price!: number;
  public categoryId!: number;
  public active!: boolean;
  public link!: string;    

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Service.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    duration: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    price: { type: DataTypes.FLOAT.UNSIGNED, allowNull: false },
    categoryId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

    // <-- NUEVO: UUID único, NOT NULL y autogenerado
    link: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
    },
  },
  {
    sequelize,
    modelName: "Service",
    tableName: "services",
    timestamps: true,
  }
);
attachDbLengthValidator(Service as any, "services");
export type { ServiceCreationAttributes };
