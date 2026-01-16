import { Service } from "typedi";
import { DoctorRepository } from "../doctors/doctor.repository";
import { UserRepository } from "../users/user.repository";
import { generateToken } from "../../server/utils/jwt.util";
import bcrypt from "bcryptjs";

@Service()
export class PublicService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async getAllDoctors(criteria: any = {}) {
    const doctors = await this.doctorRepository.findAll();
    return doctors.map((doc) => ({
      id: doc.id,
      firstName: doc.firstName,
      lastName: doc.lastName,
      bio: doc.bio,
      consultationFee: doc.consultationFee,
      specialties: (doc as any).specialties || [],
    }));
  }

  async getDoctorById(id: number) {
    const doc = await this.doctorRepository.findById(id);
    if (!doc) return null;
    return {
      id: doc.id,
      firstName: doc.firstName,
      lastName: doc.lastName,
      bio: doc.bio,
      consultationFee: doc.consultationFee,
      specialties: (doc as any).specialties || [],
    };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: any; token: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const token = generateToken({ id: user.id, role: user.role });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}