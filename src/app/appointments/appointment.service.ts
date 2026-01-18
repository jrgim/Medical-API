import { Service } from "typedi";
import { AppointmentRepository } from "./appointment.repository";
import { AvailabilityRepository } from "../availability/availability.repository";
import { NotificationService } from "../notifications/notification.service";
import { PatientRepository } from "../patients/patient.repository";
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
    private readonly notificationService: NotificationService,
    private readonly patientRepository: PatientRepository,
  ) {}

  async getPatientByUserId(userId: number) {
    return await this.patientRepository.findByUserId(userId);
  }

  async getAppointments(criteria: any): Promise<Appointment[]> {
    return await this.appointmentRepository.findAll(criteria);
  }

  async getAppointmentById(id: number): Promise<Appointment | null> {
    return await this.appointmentRepository.findById(id);
  }

  async createAppointment(data: any): Promise<Appointment> {
    const slots = await this.availabilityRepository.findByDoctorId(
      data.doctorId,
      data.appointmentDate,
    );

    const availableSlot = slots.find(
      (slot) => slot.time === data.appointmentTime && slot.isAvailable,
    );

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

    if (!appointment) {
      throw new Error("Failed to create appointment");
    }

    await this.availabilityRepository.updateAvailabilityStatus(
      data.doctorId,
      data.appointmentDate,
      data.appointmentTime,
      false,
    );

    const patient = await this.patientRepository.findById(data.patientId);
    if (patient && patient.userId) {
      await this.notificationService.createNotification({
        userId: patient.userId,
        title: "Appointment Confirmed",
        message: `Your appointment has been confirmed for ${data.appointmentDate} at ${data.appointmentTime}`,
        type: "appointment",
      });
    }

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

      const slots = await this.availabilityRepository.findByDoctorId(
        appointment.doctorId,
        newDate,
      );

      const availableSlot = slots.find(
        (slot) => slot.time === newTime && slot.isAvailable,
      );

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
    );

    const availableSlot = slots.find(
      (slot) => slot.time === time && slot.isAvailable,
    );

    if (!availableSlot) {
      throw new Error("New time slot is not available");
    }

    const updateData: AppointmentUpdateDto = {
      appointmentDate: date,
      appointmentTime: time,
    };

    const updatedAppointment = await this.appointmentRepository.update(
      id,
      updateData,
    );

    if (updatedAppointment) {
      const patient = await this.patientRepository.findById(
        appointment.patientId,
      );
      if (patient && patient.userId) {
        await this.notificationService.createNotification({
          userId: patient.userId,
          title: "Appointment Rescheduled",
          message: `Your appointment has been rescheduled for ${date} at ${time}${reason ? `. Reason: ${reason}` : ""}`,
          type: "appointment",
        });
      }
    }

    return updatedAppointment;
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

    const cancelledAppointment = await this.appointmentRepository.update(
      id,
      updateData,
    );

    await this.availabilityRepository.updateAvailabilityStatus(
      appointment.doctorId,
      appointment.appointmentDate,
      appointment.appointmentTime,
      true,
    );

    if (cancelledAppointment) {
      const patient = await this.patientRepository.findById(
        appointment.patientId,
      );
      if (patient && patient.userId) {
        await this.notificationService.createNotification({
          userId: patient.userId,
          title: "Cita Cancelada",
          message: `Su cita del ${appointment.appointmentDate} a las ${appointment.appointmentTime} ha sido cancelada${reason ? `. Razón: ${reason}` : ""}`,
          type: "appointment",
        });
      }
    }

    return cancelledAppointment;
  }
}