export interface Availability {
  id?: number;
  doctorId: number;
  dayOfWeek: number; // 0-6 (Monday-Sunday)
  startTime: string;
  endTime: string;
  appointmentId?: number;
  isAvailable?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AvailabilityCreateDto {
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

export interface AvailabilityUpdateDto {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
}
