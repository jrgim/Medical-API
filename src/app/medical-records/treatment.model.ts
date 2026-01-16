export interface Treatment {
  id?: number;
  medicalRecordId: number;
  medication: string;
  duration?: string;
  createdAt?: Date;
}

export interface TreatmentCreateDto {
  medicalRecordId: number;
  medication: string;
  duration?: string;
}

export interface TreatmentUpdateDto {
  medication?: string;
  duration?: string;
}