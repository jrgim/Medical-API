export interface MedicalRecord {
  id?: number;
  patientId: number;
  doctorId: number;
  appointmentId?: number;
  diagnosis: string;
  treatmentPlan?: string;
  notes?: string;
  followUpDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MedicalRecordCreateDto {
  patientId: number;
  doctorId: number;
  appointmentId?: number;
  diagnosis: string;
  treatmentPlan?: string;
  notes?: string;
  followUpDate?: Date;
}

export interface MedicalRecordUpdateDto {
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  followUpDate?: Date;
}