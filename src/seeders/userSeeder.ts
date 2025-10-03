// seeders/seedUser.ts
import { User } from "../models/User";

const seedUser = async () => {
  await User.bulkCreate(
    [
      {
        name: "TEST1",
        lastName: "TEST1",
        email: "test1@flexitaim.com",
        cel: "1111111111",
        roleId: 1,
        active: true,
        password: "Test1234", 
      },
      {
        name: "TEST2",
        lastName: "TEST2",
        email: "test2@flexitaim.com",
        cel: "1111111111",
        roleId: 2,
        active: true,
        password: "Test1234", 
      },
      {
        name: "TEST3",
        lastName: "TEST3",
        email: "test3@flexitaim.com",
        cel: "1111111111",
        roleId: 3,
        active: true,
        password: "Test1234",
      }
    ],
    { individualHooks: true }
  );
};

export default seedUser;
