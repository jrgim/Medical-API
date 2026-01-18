import { Service } from "typedi";
import { PatientRepository } from "./patient.repository";
import { UserRepository } from "../users/user.repository";
import { Patient, PatientCreateDto, PatientUpdateDto } from "./patient.model";
import bcrypt from "bcryptjs";

@Service()
export class PatientService {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async getAllPatients(filters?: any): Promise<Patient[]> {
    return await this.patientRepository.findAll();
  }

  async getPatientById(id: number): Promise<Patient | null> {
    return await this.patientRepository.findById(id);
  }

  async getPatientByUserId(userId: number): Promise<Patient | null> {
    return await this.patientRepository.findByUserId(userId);
  }

  async getPatientsByDoctorId(doctorId: number): Promise<Patient[]> {
    return await this.patientRepository.findPatientsByDoctorId(doctorId);
  }

  async createPatient(data: any): Promise<any> {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await this.userRepository.create({
        email: data.email,
        password: hashedPassword,
        role: "patient",
      });

      if (!user || !user.id) {
        throw new Error("Failed to create user");
      }

      const patient = await this.patientRepository.create({
        ...data,
        userId: user.id,
      });
      return { ...patient, user };
    } catch (error) {
      throw error;
    }
  }

  async updatePatient(
    id: number,
    data: PatientUpdateDto
  ): Promise<Patient | null> {
    return await this.patientRepository.update(id, data);
  }

  async deletePatient(id: number): Promise<boolean> {
    const patient = await this.patientRepository.findById(id);
    if (!patient) throw new Error("Patient not found");

    return await this.patientRepository.delete(id);
  }
}