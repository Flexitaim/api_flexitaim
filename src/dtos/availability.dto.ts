export interface CreateAvailabilityDto {
  serviceId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
}

export interface UpdateAvailabilityDto {
  serviceId?: number;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
}
