import { Availability } from "../models/Availability";

const seedAvailability = async () => {
  await Availability.bulkCreate([
    {
      serviceId: 1,
      dayOfWeek: 1, // lunes
      startTime: "09:00",
      endTime: "13:00",
      startDate: "2026-04-01",
      endDate: "2026-06-30",
      active: true,
    },
    {
      serviceId: 1,
      dayOfWeek: 3, // miércoles
      startTime: "14:00",
      endTime: "18:00",
      startDate: "2026-04-01",
      endDate: "2026-06-30",
      active: true,
    },
    {
      serviceId: 2,
      dayOfWeek: 2, // martes
      startTime: "10:00",
      endTime: "12:00",
      startDate: "2026-04-01",
      endDate: "2026-06-30",
      active: true,
    },
    {
      serviceId: 3,
      dayOfWeek: 4, // jueves
      startTime: "16:00",
      endTime: "20:00",
      startDate: "2026-04-01",
      endDate: "2026-06-30",
      active: true,
    },
    {
      serviceId: 4,
      dayOfWeek: 5, // viernes
      startTime: "08:00",
      endTime: "10:00",
      startDate: "2026-04-01",
      endDate: "2026-06-30",
      active: true,
    },
  ]);
};

export default seedAvailability;
