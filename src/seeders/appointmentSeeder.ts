import { Status } from "../enums/status.enum";
import { Appointment } from "../models/Appointment";

const seedAppointments = async () => {
  await Appointment.bulkCreate([
    {
      serviceId: 1,
      userId: 1, 
      date: "2025-04-10",
      startTime: "10:00",
      endTime: "10:30",
      status: Status.AVAILABLE,
      active: true,
    },
    {
      serviceId: 2,
      userId: 2,
      date: "2025-04-11",
      startTime: "11:00",
      endTime: "11:30",
      status: Status.CONFIRMED,
      active: true,
    },
    {
      serviceId: 3,
      userId: 3,
      date: "2025-04-12",
      startTime: "14:00",
      endTime: "14:45",
      status: Status.AVAILABLE,
      active: true,
    },
    {
      serviceId: 4,
      userId: 4,
      date: "2025-04-13",
      startTime: "09:30",
      endTime: "10:00",
      status: Status.CONFIRMED,
      active: true,
    },
    {
      serviceId: 5,
      userId: 5,
      date: "2025-04-14",
      startTime: "13:00",
      endTime: "13:30",
      status: Status.CANCELLED,
      active: true,
    },
  ]);
};

export default seedAppointments;
