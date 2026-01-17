export interface Appointment {
  id?: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  status?: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
  reason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppointmentCreateDto {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  status?: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
  reason?: string;
}

export interface AppointmentUpdateDto {
  appointmentDate?: string;
  appointmentTime?: string;
  status?: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
  reason?: string;
}