import { Cancellation } from "../models/Cancellation";

const seedCancellation = async () => {
  await Cancellation.bulkCreate([
    {
      appointmentId: 3,
      active: true
    },
    {
      appointmentId: 4,
      active: true
    },
    {
      appointmentId: 5,
      active: true
    },
    {
      appointmentId: 2,
      active: true
    },
    {
      appointmentId: 1,
      active: true
    }
  ]);
};

export default seedCancellation;
