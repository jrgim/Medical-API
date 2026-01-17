export interface Notification {
  id?: number;
  userId: number;
  title: string;
  message: string;
  type: "appointment" | "reminder" | "system" | "alert" | "info";
  read?: boolean;
  createdAt?: Date;
}

export interface NotificationCreateDto {
  userId: number;
  title: string;
  message: string;
  type: "appointment" | "reminder" | "system" | "alert" | "info";
  read?: boolean;
}