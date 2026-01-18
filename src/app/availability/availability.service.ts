import { Service } from "typedi";
import { AvailabilityRepository } from "./availability.repository";
import { Availability, AvailabilityCreateDto, AvailabilityUpdateDto } from "./availability.model";

@Service()
export class AvailabilityService {
  constructor(
    private readonly availabilityRepository: AvailabilityRepository,
  ) {}

  async getDoctorAvailability(doctorId: number, date?: string): Promise<Availability[]> {
    return await this.availabilityRepository.findByDoctorId(doctorId, date);
  }

  async setAvailability(doctorId: number, slots: AvailabilityCreateDto[]): Promise<Availability[]> {
    return await this.availabilityRepository.bulkCreate(slots);
  }

  async updateSlot(id: number, data: AvailabilityUpdateDto): Promise<Availability | null> {
    return await this.availabilityRepository.update(id, data);
  }

  async deleteSlot(id: number): Promise<boolean> {
    return await this.availabilityRepository.delete(id);
  }
}