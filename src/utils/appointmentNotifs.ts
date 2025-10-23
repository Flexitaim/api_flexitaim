import { Service } from "../models/Service";
import { User } from "../models/User";
import { Appointment } from "../models/Appointment";

// Carga datos relacionados: dueño del servicio y cliente (booker)
export async function loadAppointmentContext(appt: Appointment) {
  const service = await Service.findOne({ where: { id: appt.serviceId, active: true } });
  if (!service) throw new Error("Service not found");

  const owner = await User.findOne({ where: { id: service.userId, active: true } });
  if (!owner) throw new Error("Owner user not found");

  const client = await User.findOne({ where: { id: appt.userId, active: true } });
  if (!client) throw new Error("Client user not found");

  return { service, owner, client };
}

export function formatDateTime(dateISO: string, start: string) {
  // dateISO: 'YYYY-MM-DD'; start 'HH:mm:ss'
  return `${dateISO} ${start.slice(0,5)} hs`;
}

export function buildBookedEmailForOwner(opts: {
  serviceName: string;
  ownerName: string;
  clientName: string;
  clientEmail: string;
  date: string;
  startTime: string;
}) {
  const when = formatDateTime(opts.date, opts.startTime);
  const subject = `🗓️ Nuevo turno tomado – ${opts.serviceName}`;
  const html =
    `<h2>Hola ${opts.ownerName},</h2>
     <p>Tienes un nuevo turno para <b>${opts.serviceName}</b>.</p>
     <ul>
       <li><b>Cliente:</b> ${opts.clientName} (${opts.clientEmail})</li>
       <li><b>Fecha y hora:</b> ${when}</li>
     </ul>
     <p>¡Éxitos!</p>`;
  const text =
    `Hola ${opts.ownerName},
Nuevo turno para ${opts.serviceName}.
Cliente: ${opts.clientName} (${opts.clientEmail})
Fecha y hora: ${when}`;
  return { subject, html, text };
}

export function buildCancelEmailForClient(opts: {
  serviceName: string;
  clientName: string;
  ownerName: string;
  date: string;
  startTime: string;
}) {
  const when = formatDateTime(opts.date, opts.startTime);
  const subject = `❌ Cancelación de turno – ${opts.serviceName}`;
  const html =
    `<h2>Hola ${opts.clientName},</h2>
     <p>Tu turno para <b>${opts.serviceName}</b> fue <b>cancelado por ${opts.ownerName}</b>.</p>
     <p><b>Fecha y hora:</b> ${when}</p>`;
  const text =
    `Hola ${opts.clientName},
Tu turno para ${opts.serviceName} fue cancelado por ${opts.ownerName}.
Fecha y hora: ${when}`;
  return { subject, html, text };
}

export function buildCancelEmailForOwner(opts: {
  serviceName: string;
  ownerName: string;
  clientName: string;
  date: string;
  startTime: string;
}) {
  const when = formatDateTime(opts.date, opts.startTime);
  const subject = `❌ El cliente canceló – ${opts.serviceName}`;
  const html =
    `<h2>Hola ${opts.ownerName},</h2>
     <p><b>${opts.clientName}</b> canceló su turno para <b>${opts.serviceName}</b>.</p>
     <p><b>Fecha y hora:</b> ${when}</p>`;
  const text =
    `Hola ${opts.ownerName},
${opts.clientName} canceló su turno para ${opts.serviceName}.
Fecha y hora: ${when}`;
  return { subject, html, text };
}
