import { Status } from "../enums/status.enum";

export interface CreateAppointmentDto {
  serviceId: number;
  userId: number;
  date: string; // SIEMPRE string 'YYYY-MM-DD'
  startTime: string;
  endTime: string;
  status?: Status;
}

export interface UpdateAppointmentDto {
  serviceId?: number;
  userId?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: Status;
}
