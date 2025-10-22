// src/services/appointmentService.ts
import { Appointment, AppointmentCreationAttributes } from "../models/Appointment";
import { Status } from "../enums/status.enum";
import { CreateAppointmentDto, UpdateAppointmentDto } from "../dtos/appointment.dto";
import { ApiError } from "../utils/ApiError";
import { Op } from "sequelize";
import { Service } from "../models/Service";
import User from "../models/User"; // default export en tu modelo de User
import {
  PaginationParams,
  PaginatedResult,
  buildPaginatedResult,
} from "../utils/pagination";
import { sendEmail } from "../utils/notifyClient"; // <-- cliente al Notification-MS

// -------------------- helpers de formato / contexto --------------------
function toDateOnlyString(input: string | Date): string {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) throw new ApiError("Invalid date", 400);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hhmm(time: string) {
  // 'HH:mm:ss' -> 'HH:mm'
  return time?.slice(0, 5);
}

function whenStr(date: string, startTime: string) {
  return `${date} ${hhmm(startTime)} hs`;
}

async function loadContext(appt: Appointment) {
  const service = await Service.findOne({ where: { id: appt.serviceId, active: true } });
  if (!service) throw new ApiError("Service not found", 404);

  const owner = await User.findOne({ where: { id: service.userId, active: true } });
  if (!owner) throw new ApiError("Owner user not found", 404);

  const client = await User.findOne({ where: { id: appt.userId, active: true } });
  if (!client) throw new ApiError("Client user not found", 404);

  return { service, owner, client };
}

// mails
function buildBookedEmailForOwner(args: {
  serviceName: string;
  ownerName: string;
  clientName: string;
  clientEmail: string;
  date: string;
  startTime: string;
}) {
  const when = whenStr(args.date, args.startTime);
  const subject = `🗓️ Nuevo turno confirmado – ${args.serviceName}`;
  const html = `<h2>Hola ${args.ownerName},</h2>
  <p>Tenés un nuevo turno para <b>${args.serviceName}</b>.</p>
  <ul>
    <li><b>Cliente:</b> ${args.clientName} (${args.clientEmail})</li>
    <li><b>Fecha y hora:</b> ${when}</li>
  </ul>
  <p>¡Éxitos!</p>
  <p>FlexiTaim</p>`;
  const text = `Hola ${args.ownerName},
Nuevo turno para ${args.serviceName}.
Cliente: ${args.clientName} (${args.clientEmail})
Fecha y hora: ${when}`;
  return { subject, html, text };
}

function buildCancelEmailForClient(args: {
  serviceName: string;
  clientName: string;
  ownerName: string;
  date: string;
  startTime: string;
}) {
  const when = whenStr(args.date, args.startTime);
  const subject = `❌ Cancelación de turno – ${args.serviceName}`;
  const html = `<h2>Hola ${args.clientName},</h2>
  <p>Tu turno para <b>${args.serviceName}</b> fue <b>cancelado por ${args.ownerName}</b>.</p>
  <p><b>Fecha y hora:</b> ${when}</p>
  <p>FlexiTaim</p>`;
  const text = `Hola ${args.clientName},
Tu turno para ${args.serviceName} fue cancelado por ${args.ownerName}.
Fecha y hora: ${when}`;
  return { subject, html, text };
}

function buildCancelEmailForOwner(args: {
  serviceName: string;
  ownerName: string;
  clientName: string;
  date: string;
  startTime: string;
}) {
  const when = whenStr(args.date, args.startTime);
  const subject = `❌ El cliente canceló – ${args.serviceName}`;
  const html = `<h2>Hola ${args.ownerName},</h2>
  <p><b>${args.clientName}</b> canceló su turno para <b>${args.serviceName}</b>.</p>
  <p><b>Fecha y hora:</b> ${when}</p>`;
  const text = `Hola ${args.ownerName},
${args.clientName} canceló su turno para ${args.serviceName}.
Fecha y hora: ${when}`;
  return { subject, html, text };
}

// -------------------- servicio original + notificaciones --------------------
export const getAllAppointments = async (
  pg: PaginationParams
): Promise<PaginatedResult<Appointment>> => {
  const { limit, offset, order } = pg;
  const { rows, count } = await Appointment.findAndCountAll({
    where: { active: true },
    limit,
    offset,
    order,
    distinct: true,
  });
  return buildPaginatedResult(rows, count, pg);
};

export const getAppointmentById = async (id: number) => {
  const appointment = await Appointment.findOne({ where: { id, active: true } });
  if (!appointment) throw new ApiError("Appointment not found", 404);
  return appointment;
};

export const createAppointment = async (data: CreateAppointmentDto) => {
  const date = toDateOnlyString(data.date);

  const overlapping = await Appointment.findOne({
    where: {
      serviceId: data.serviceId,
      date,
      active: true,
      [Op.and]: [
        { startTime: { [Op.lt]: data.endTime } },
        { endTime: { [Op.gt]: data.startTime } },
      ],
    },
  });
  if (overlapping) throw new ApiError("Ya existe un turno en ese horario", 409);

  const appointmentData: AppointmentCreationAttributes = {
    ...data,
    userId: Number(data.userId),
    date,
    status: data.status ?? Status.AVAILABLE,
    active: true,
  };

  const created = await Appointment.create(appointmentData);

  // 🔔 Si se crea ya Confirmed → notificar al dueño
  if (created.status === Status.CONFIRMED) {
    try {
      const { service, owner, client } = await loadContext(created);
      const { subject, html, text } = buildBookedEmailForOwner({
        serviceName: service.name,
        ownerName: `${owner.name} ${owner.lastName}`,
        clientName: `${client.name} ${client.lastName}`,
        clientEmail: client.email,
        date: created.date,
        startTime: created.startTime,
      });
      await sendEmail({
        to: owner.email,
        subject,
        html,
        text,
        metadata: {
          kind: "appointment_confirmed",
          appointmentId: created.id,
          serviceId: created.serviceId,
          userId: created.userId,
        },
      });
    } catch (e) {
      console.error("[notif] createAppointment confirmed notify failed:", e);
    }
  }

  return created;
};

// Permite opcionalmente informar quién cancela (owner | client)
type UpdateOpts = { actorCancelledBy?: "owner" | "client" };

export const updateAppointment = async (id: number, data: UpdateAppointmentDto, opts?: UpdateOpts) => {
  const appointment = await Appointment.findOne({ where: { id, active: true } });
  if (!appointment) throw new ApiError("Appointment not found", 404);

  const prevStatus = appointment.status;

  const newDate = data.date ? toDateOnlyString(data.date) : appointment.date;
  const newStartTime = data.startTime ?? appointment.startTime;
  const newEndTime = data.endTime ?? appointment.endTime;
  const newServiceId = data.serviceId ?? appointment.serviceId;

  const overlapping = await Appointment.findOne({
    where: {
      serviceId: newServiceId,
      date: newDate,
      active: true,
      id: { [Op.ne]: id },
      [Op.and]: [
        { startTime: { [Op.lt]: newEndTime } },
        { endTime: { [Op.gt]: newStartTime } },
      ],
    },
  });
  if (overlapping) throw new ApiError("There is already an appointment for this service in that time slot", 400);

  await appointment.update({
    ...data,
    date: newDate,
  } as Partial<AppointmentCreationAttributes>);

  const currStatus = appointment.status;

  // (A) AVAILABLE -> CONFIRMED (tomado) → notifica al dueño
  if (prevStatus === Status.AVAILABLE && currStatus === Status.CONFIRMED) {
    try {
      const { service, owner, client } = await loadContext(appointment);
      const { subject, html, text } = buildBookedEmailForOwner({
        serviceName: service.name,
        ownerName: `${owner.name} ${owner.lastName}`,
        clientName: `${client.name} ${client.lastName}`,
        clientEmail: client.email,
        date: appointment.date,
        startTime: appointment.startTime,
      });
      await sendEmail({
        to: owner.email,
        subject,
        html,
        text,
        metadata: {
          kind: "appointment_confirmed",
          appointmentId: appointment.id,
          serviceId: appointment.serviceId,
          userId: appointment.userId,
        },
      });
    } catch (e) {
      console.error("[notif] updateAppointment confirmed notify failed:", e);
    }
  }

  // (B) -> CANCELLED
  if (currStatus === Status.CANCELLED) {
    const who = opts?.actorCancelledBy; // 'owner' | 'client' | undefined
    try {
      const { service, owner, client } = await loadContext(appointment);

      if (who === "owner") {
        // si cancela el dueño → notificar al cliente
        const { subject, html, text } = buildCancelEmailForClient({
          serviceName: service.name,
          clientName: `${client.name} ${client.lastName}`,
          ownerName: `${owner.name} ${owner.lastName}`,
          date: appointment.date,
          startTime: appointment.startTime,
        });
        await sendEmail({
          to: client.email,
          subject,
          html,
          text,
          metadata: {
            kind: "appointment_cancelled_by_owner",
            appointmentId: appointment.id,
          },
        });
      } else {
        // si cancela el cliente (o no se especifica) → notificar al dueño
        const { subject, html, text } = buildCancelEmailForOwner({
          serviceName: service.name,
          ownerName: `${owner.name} ${owner.lastName}`,
          clientName: `${client.name} ${client.lastName}`,
          date: appointment.date,
          startTime: appointment.startTime,
        });
        await sendEmail({
          to: owner.email,
          subject,
          html,
          text,
          metadata: {
            kind: "appointment_cancelled_by_client",
            appointmentId: appointment.id,
          },
        });
      }
    } catch (e) {
      console.error("[notif] updateAppointment cancel notify failed:", e);
    }
  }

  return appointment;
};

export const deleteAppointment = async (id: number) => {
  const appointment = await Appointment.findOne({ where: { id, active: true } });
  if (!appointment) throw new ApiError("Appointment not found", 404);
  await appointment.update({ active: false });
  return { message: "Appointment disabled successfully" };
};

export const getAppointmentsByServiceId = async (serviceId: number) => {
  const service = await Service.findOne({ where: { id: serviceId, active: true } });
  if (!service) {
    throw new ApiError("Service with the specified id does not exist", 404);
  }
  return await Appointment.findAll({ where: { serviceId, active: true } });
};

export const getAllAppointmentsByUserIdAll = async (
  userId: number,
  pg: PaginationParams
): Promise<PaginatedResult<Appointment>> => {
  const { limit, offset, order } = pg;
  const { rows, count } = await Appointment.findAndCountAll({
    where: { userId },
    limit,
    offset,
    order,
    distinct: true,
  });
  return buildPaginatedResult(rows, count, pg);
};
