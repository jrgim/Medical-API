import { Service } from "typedi";
import { DepartmentRepository } from "./department.repository";
import { Department, DepartmentCreateDto } from "./department.model";

@Service()
export class DepartmentService {
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async getAllDepartments(): Promise<Department[]> {
    return await this.departmentRepository.findAll();
  }

  async getDepartmentById(id: number): Promise<Department | null> {
    return await this.departmentRepository.findById(id);
  }

  async createDepartment(data: DepartmentCreateDto): Promise<Department> {
    return await this.departmentRepository.create(data);
  }

  async updateDepartment(id: number, data: Partial<DepartmentCreateDto>): Promise<Department | null> {
    return await this.departmentRepository.update(id, data);
  }

  async deleteDepartment(id: number): Promise<boolean> {
    return await this.departmentRepository.delete(id);
  }
}