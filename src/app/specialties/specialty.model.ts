export interface Specialty {
  id?: number;
  name: string;
  description?: string;
  departmentId?: number;
  createdAt?: Date;
}

export interface SpecialtyCreateDto {
  name: string;
  description?: string;
  departmentId?: number;
}