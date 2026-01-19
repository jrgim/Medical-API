export interface Availability {
  id?: number;
  doctorId: number;
  date: string;
  time: string;
  isAvailable?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AvailabilityCreateDto {
  doctorId?: number;
  date: string;
  time: string;
  isAvailable?: boolean;
}

export interface AvailabilityUpdateDto {
  date?: string;
  time?: string;
  isAvailable?: boolean;
}
