import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../utils/databaseService";
import { attachDbLengthValidator } from "../utils/lengthValidator";

interface AvailabilityAttributes {
  id: number;
  serviceId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AvailabilityCreationAttributes
  extends Optional<AvailabilityAttributes, "id" | "active" | "createdAt" | "updatedAt"> {}

export class Availability
  extends Model<AvailabilityAttributes, AvailabilityCreationAttributes>
  implements AvailabilityAttributes {
  public id!: number;
  public serviceId!: number;
  public dayOfWeek!: number;
  public startTime!: string;
  public endTime!: string;
  public startDate!: string;
  public endDate!: string;
  public active!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/** Helpers “date-only” anclados a UTC */
const isYmd = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? "");
const ymd = (s: string) => (s ?? "").trim().slice(0, 10);
const ymdToEpochDay = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return Math.floor(Date.UTC(y, (m ?? 1) - 1, d ?? 1) / 86400000);
};
const todayEpochDayUTC = () => {
  const now = new Date();
  return Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000);
};
const timeToSeconds = (t: string) => {
  const [h = 0, m = 0, s = 0] = (t ?? "").split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

Availability.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    serviceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    dayOfWeek: { type: DataTypes.INTEGER, allowNull: false, validate: { isInt: true, min: 0, max: 6 } },
    startTime: { type: DataTypes.TIME, allowNull: false },
    endTime:   { type: DataTypes.TIME, allowNull: false },

    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      set(val: any) {
        const v = ymd(String(val));
        if (!isYmd(v)) throw new Error("startDate must be 'YYYY-MM-DD'.");
        this.setDataValue("startDate", v);
      },
      get(this: Availability) {
        return this.getDataValue("startDate"); // siempre string
      }
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      set(val: any) {
        const v = ymd(String(val));
        if (!isYmd(v)) throw new Error("endDate must be 'YYYY-MM-DD'.");
        this.setDataValue("endDate", v);
      },
      get(this: Availability) {
        return this.getDataValue("endDate"); // siempre string
      }
    },

    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    modelName: "Availability",
    tableName: "availabilities",
    timestamps: true,

    validate: {
      startTimeBeforeEndTime(this: Availability) {
        if (timeToSeconds(this.startTime) >= timeToSeconds(this.endTime)) {
          throw new Error("startTime must be strictly before endTime.");
        }
      },
      startDateNotAfterEndDate(this: Availability) {
        if (!isYmd(this.startDate) || !isYmd(this.endDate)) {
          throw new Error("Dates must be 'YYYY-MM-DD'.");
        }
        if (ymdToEpochDay(this.startDate) > ymdToEpochDay(this.endDate)) {
          throw new Error("startDate must be on or before endDate.");
        }
      },
      datesNotInPast(this: Availability) {
        const today = todayEpochDayUTC();
        if (ymdToEpochDay(this.startDate) < today) throw new Error("startDate cannot be in the past.");
        if (ymdToEpochDay(this.endDate)   < today) throw new Error("endDate cannot be in the past.");
      },
    },
  }
);

attachDbLengthValidator(Availability as any, "availabilities");
export type { AvailabilityCreationAttributes };
export default Availability;
