export interface User {
  id?: number;
  email: string;
  password: string;
  role: "patient" | "doctor" | "admin";
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreateDto {
  email: string;
  password: string;
  role: "patient" | "doctor" | "admin";
}

// Para respuestas sin contraseña
export interface UserResponseDto {
  id: number;
  email: string;
  role: "patient" | "doctor" | "admin";
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}