import { Service } from "typedi";
import { SpecialtyRepository } from "./specialty.repository";
import { Specialty, SpecialtyCreateDto } from "./specialty.model";

@Service()
export class SpecialtyService {
  constructor(private readonly specialtyRepository: SpecialtyRepository) {}

  async getAllSpecialties(): Promise<Specialty[]> {
    return await this.specialtyRepository.findAll();
  }

  async getSpecialtyById(id: number): Promise<Specialty | null> {
    return await this.specialtyRepository.findById(id);
  }

  async createSpecialty(data: SpecialtyCreateDto): Promise<Specialty> {
    return await this.specialtyRepository.create(data);
  }

  async updateSpecialty(id: number, data: Partial<SpecialtyCreateDto>): Promise<Specialty | null> {
    return await this.specialtyRepository.update(id, data);
  }

  async deleteSpecialty(id: number): Promise<boolean> {
    return await this.specialtyRepository.delete(id);
  }
}