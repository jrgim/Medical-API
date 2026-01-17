import { Service } from "typedi";
import { AppointmentRepository } from "./appointment.repository";
import { AvailabilityRepository } from "../availability/availability.repository";
import {
  Appointment,
  AppointmentCreateDto,
  AppointmentUpdateDto,
} from "./appointment.model";

@Service()
export class AppointmentService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly availabilityRepository: AvailabilityRepository,
  ) {}

  async getAppointments(criteria: any): Promise<Appointment[]> {
    return await this.appointmentRepository.findAll(criteria);
  }

  async getAppointmentById(id: number): Promise<Appointment | null> {
    return await this.appointmentRepository.findById(id);
  }

  async createAppointment(data: any): Promise<Appointment> {
    const slots = await this.availabilityRepository.findByDoctorId(data.doctorId, data.appointmentDate, data.appointmentDate);

    const availableSlot = slots.find((slot) => slot.startTime === data.appointmentTime && slot.isAvailable && !slot.appointmentId);

    if (!availableSlot) {
      throw new Error("No availability slot found for this date and time");
    }

    const appointmentData: AppointmentCreateDto = {
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      reason: data.reason,
      status: "scheduled",
    };

    const appointment =
      await this.appointmentRepository.create(appointmentData);
    return appointment;
  }

  async updateAppointment(
    id: number,
    data: AppointmentUpdateDto,
    user: any,
  ): Promise<Appointment | null> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) throw new Error("Appointment not found");

    // Validate availability if date or time is being changed
    if (data.appointmentDate || data.appointmentTime) {
      const newDate = data.appointmentDate || appointment.appointmentDate;
      const newTime = data.appointmentTime || appointment.appointmentTime;

      const slots = await this.availabilityRepository.findByDoctorId(appointment.doctorId, newDate, newDate);

      const availableSlot = slots.find((slot) => slot.startTime === newTime && slot.isAvailable && !slot.appointmentId);

      if (!availableSlot) {
        throw new Error("New time slot is not available");
      }
    }

    return await this.appointmentRepository.update(id, data);
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return await this.appointmentRepository.delete(id);
  }

  async rescheduleAppointment(
    id: number,
    newDateTime: string,
    reason?: string,
  ): Promise<Appointment | null> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    let date: string;
    let time: string;

    if (newDateTime.includes("T")) {
      const parts = newDateTime.split("T");
      date = parts[0];
      time = parts[1].substring(0, 5);
    } else {
      date = newDateTime;
      time = newDateTime;
    }

    const slots = await this.availabilityRepository.findByDoctorId(
      appointment.doctorId,
      date,
      date,
    );

    const availableSlot = slots.find(
      (slot) =>
        slot.startTime === time && slot.isAvailable && !slot.appointmentId,
    );

    if (!availableSlot) {
      throw new Error("New time slot is not available");
    }

    const updateData: AppointmentUpdateDto = {
      appointmentDate: date,
      appointmentTime: time,
    };

    return await this.appointmentRepository.update(id, updateData);
  }

  async cancelAppointment(
    id: number,
    reason?: string,
  ): Promise<Appointment | null> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.status === "cancelled") {
      throw new Error("Appointment is already cancelled");
    }

    const updateData: AppointmentUpdateDto = {
      status: "cancelled",
    };

    return await this.appointmentRepository.update(id, updateData);
  }
}