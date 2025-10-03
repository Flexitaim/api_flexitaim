import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../utils/databaseService";
import { Status } from "../enums/status.enum";
import { attachDbLengthValidator } from "../utils/lengthValidator";

interface AppointmentAttributes {
  id: number;
  serviceId: number;
  userId: number;          
  date: string;            // 'YYYY-MM-DD'
  startTime: string;       // 'HH:mm:ss' según DB
  endTime: string;         // 'HH:mm:ss'
  status: Status;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppointmentCreationAttributes
  extends Optional<AppointmentAttributes, "id" | "active" | "status" | "createdAt" | "updatedAt"> {}

export class Appointment
  extends Model<AppointmentAttributes, AppointmentCreationAttributes>
  implements AppointmentAttributes
{
  public id!: number;
  public serviceId!: number;
  public userId!: number;     
  public date!: string;
  public startTime!: string;
  public endTime!: string;
  public status!: Status;
  public active!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Appointment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    serviceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,  
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,           // string 'YYYY-MM-DD'
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(Status)),
      allowNull: false,
      defaultValue: Status.AVAILABLE,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Appointment",
    tableName: "appointments",
    timestamps: true,
  }
);
attachDbLengthValidator(Appointment as any, "appointments");