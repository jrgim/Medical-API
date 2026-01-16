export interface Patient {
  id?: number;
  userId: number;
  firstName: string;
  lastName: string;
  dni?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  allergies?: string;
  insuranceNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PatientCreateDto {
  userId: number;
  firstName: string;
  lastName: string;
  dni?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  allergies?: string;
  insuranceNumber?: string;
}

export interface PatientUpdateDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  allergies?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
}