export interface User {
  id?: number;
  email: string;
  password: string;
  role: "patient" | "doctor" | "admin";
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
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
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}