import { Service } from "typedi";
import { DoctorRepository } from "./doctor.repository";
import { UserRepository } from "../users/user.repository";
import { Doctor, DoctorCreateDto, DoctorUpdateDto } from "./doctor.model";
import bcrypt from "bcryptjs";

@Service()
export class DoctorService {
    constructor(
        private readonly doctorRepository: DoctorRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async getAllDoctors(filters?: any): Promise<Doctor[]> {
        return await this.doctorRepository.findAll(filters);
    }

    async getDoctorById(id: number): Promise<Doctor | null> {
        return await this.doctorRepository.findById(id);
    }

    async getDoctorByUserId(userId: number): Promise<Doctor | null> {
        return await this.doctorRepository.findByUserId(userId);
    }

    async createDoctor(data: any): Promise<any> {
        try {
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser) {
        throw new Error("Email already in use");
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.userRepository.create({
            email: data.email,
            password: hashedPassword,
            role: "doctor",
        });

        if (!user || !user.id) {
            throw new Error("Failed to create user");
        }

        const doctor = await this.doctorRepository.create({
            ...data,
            userId: user.id,
        });

        if (data.specialtyIds && data.specialtyIds.length > 0) {
            for (const specialtyId of data.specialtyIds) {
            await this.doctorRepository.addSpecialty(doctor.id!, specialtyId);
            }
        }

        return { ...doctor, user };
        } catch (error) {
        throw error;
        }
    }

    async updateDoctor(
        id: number,
        data: DoctorUpdateDto
    ): Promise<Doctor | null> {
        return await this.doctorRepository.update(id, data);
    }

    async updateSpecialties(
        id: number,
        specialtyIds: number[]
    ): Promise<Doctor | null> {
        const doctor = await this.doctorRepository.findById(id);
        if (!doctor) throw new Error("Doctor not found");

        for (const specialtyId of specialtyIds) {
        await this.doctorRepository.addSpecialty(id, specialtyId);
        }

        return await this.doctorRepository.findById(id);
    }

    async deleteDoctor(id: number): Promise<boolean> {
        const doctor = await this.doctorRepository.findById(id);
        if (!doctor) return false;

        return await this.doctorRepository.delete(id);
    }
}