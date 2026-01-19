import { Router } from "express";
import { Service } from "typedi";
import { UserController } from "../../app/users/user.controller";
import { PatientController } from "../../app/patients/patient.controller";
import { DoctorController } from "../../app/doctors/doctor.controller";
import { SpecialtyController } from "../../app/specialties/specialty.controller";
import { DepartmentController } from "../../app/departments/department.controller";
import { AvailabilityController } from "../../app/availability/availability.controller";
import { AppointmentController } from "../../app/appointments/appointment.controller";
import { MedicalRecordController } from "../../app/medical-records/medicalRecord.controller";
import { NotificationController } from "../../app/notifications/notification.controller";
import { AuditLogController } from "../../app/audit/auditLog.controller";
import { PublicController } from "../../app/public/public.controller";

@Service()
export class Api {
  private apiRouter: Router;

  constructor(
    private userController: UserController,
    private patientController: PatientController,
    private doctorController: DoctorController,
    private specialtyController: SpecialtyController,
    private departmentController: DepartmentController,
    private availabilityController: AvailabilityController,
    private appointmentController: AppointmentController,
    private medicalRecordController: MedicalRecordController,
    private notificationController: NotificationController,
    private auditLogController: AuditLogController,
    private publicController: PublicController,
  ) {
    this.apiRouter = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.apiRouter.use("/public", this.publicController.getRouter());
    this.apiRouter.use("/users", this.userController.getRouter());
    this.apiRouter.use("/patients", this.patientController.getRouter());
    this.apiRouter.use("/doctors", this.doctorController.getRouter());
    this.apiRouter.use("/specialties", this.specialtyController.getRouter());
    this.apiRouter.use("/departments", this.departmentController.getRouter());
    this.apiRouter.use(
      "/availability",
      this.availabilityController.getRouter(),
    );
    this.apiRouter.use("/appointments", this.appointmentController.getRouter());
    this.apiRouter.use(
      "/medical-records",
      this.medicalRecordController.getRouter(),
    );
    this.apiRouter.use(
      "/notifications",
      this.notificationController.getRouter(),
    );
    this.apiRouter.use("/audit-logs", this.auditLogController.getRouter());
  }

  getApiRouter(): Router {
    return this.apiRouter;
  }
}
