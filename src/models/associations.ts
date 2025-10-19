import { User } from "./User";
import { Service } from "./Service";
import { Appointment } from "./Appointment";
import { Cancellation } from "./Cancellation";
import { Availability } from "./Availability";
import { Role } from "./Role";
import { Payment } from "./Payment";            
import { Favorite } from "./Favorite";

export const setupAssociations = () => {
  // Client - Service
  Service.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(Service, { foreignKey: "userId", as: "services" });

  // User - Appointment
  User.hasMany(Appointment, { foreignKey: "userId", as: "appointments" });
  Appointment.belongsTo(User, { foreignKey: "userId", as: "user" });

  // Appointment - Cancellation
  Appointment.hasOne(Cancellation, { foreignKey: "appointmentId", as: "cancellation" });
  Cancellation.belongsTo(Appointment, { foreignKey: "appointmentId", as: "appointment" });

  // Service - Availability
  Service.hasMany(Availability, { foreignKey: "serviceId", as: "availabilities" });
  Availability.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

  // User - Role
  Role.hasMany(User, { foreignKey: "roleId", as: "users" });
  User.belongsTo(Role, { foreignKey: "roleId", as: "role" });

  // User - Payment  (Payment.userId → User.id UUID)
  User.hasMany(Payment, { foreignKey: "userId", as: "payments" });
  Payment.belongsTo(User, { foreignKey: "userId", as: "user" });

  
  // Favoritos
  User.hasMany(Favorite, { foreignKey: "userId", as: "favorites", constraints: true });
  Favorite.belongsTo(User, { foreignKey: "userId", as: "user", constraints: true });

  Service.hasMany(Favorite, { foreignKey: "serviceId", as: "favorites", constraints: true });
  Favorite.belongsTo(Service, { foreignKey: "serviceId", as: "service", constraints: true });
};