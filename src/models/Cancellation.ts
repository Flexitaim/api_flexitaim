import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../utils/databaseService";
import { attachDbLengthValidator } from "../utils/lengthValidator";

interface CancellationAttributes {
  id: number;
  appointmentId: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CancellationCreationAttributes
  extends Optional<CancellationAttributes, "id" | "active" | "createdAt" | "updatedAt"> {}

export class Cancellation
  extends Model<CancellationAttributes, CancellationCreationAttributes>
  implements CancellationAttributes
{
  public id!: number;
  public appointmentId!: number;
  public active!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Cancellation.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Cancellation",
    tableName: "cancellations",
    timestamps: true,
  }
);
attachDbLengthValidator(Cancellation as any, "cancellations");
export type { CancellationCreationAttributes };
