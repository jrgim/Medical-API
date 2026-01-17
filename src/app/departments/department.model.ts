export interface Department {
  id?: number;
  name: string;
  description?: string;
  phone?: string;
  location?: string;
  createdAt?: Date;
}

export interface DepartmentCreateDto {
  name: string;
  description?: string;
  phone?: string;
  location?: string;
}