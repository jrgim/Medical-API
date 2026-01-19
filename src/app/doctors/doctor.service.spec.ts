import "reflect-metadata";
import { Container } from "typedi";
import { DoctorService } from "./doctor.service";
import { DoctorRepository } from "./doctor.repository";
import { UserRepository } from "../users/user.repository";
import { Doctor } from "./doctor.model";
import { User } from "../users/user.model";
import bcrypt from "bcryptjs";

jest.mock("bcryptjs");

describe("DoctorService", () => {
  let doctorService: DoctorService;
  let doctorRepositoryMock: jest.Mocked<DoctorRepository>;
  let userRepositoryMock: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    doctorRepositoryMock = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addSpecialty: jest.fn(),
      removeSpecialty: jest.fn(),
      getSpecialties: jest.fn(),
    } as unknown as jest.Mocked<DoctorRepository>;

    userRepositoryMock = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    Container.set(DoctorRepository, doctorRepositoryMock);
    Container.set(UserRepository, userRepositoryMock);
    doctorService = Container.get(DoctorService);
  });

  describe("getAllDoctors", () => {
    it("should return all doctors", async () => {
      const doctors: Doctor[] = [
        {
          id: 1,
          userId: 1,
          firstName: "John",
          lastName: "Doe",
          licenseNumber: "LIC123",
        },
        {
          id: 2,
          userId: 2,
          firstName: "Jane",
          lastName: "Smith",
          licenseNumber: "LIC456",
        },
      ];

      doctorRepositoryMock.findAll.mockResolvedValueOnce(doctors);

      const result = await doctorService.getAllDoctors();

      expect(doctorRepositoryMock.findAll).toHaveBeenCalled();
      expect(result).toEqual(doctors);
    });
  });

  describe("getDoctorById", () => {
    it("should return a doctor by id", async () => {
      const doctor: Doctor = {
        id: 1,
        userId: 1,
        firstName: "John",
        lastName: "Doe",
        licenseNumber: "LIC123",
      };

      doctorRepositoryMock.findById.mockResolvedValueOnce(doctor);

      const result = await doctorService.getDoctorById(1);

      expect(doctorRepositoryMock.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(doctor);
    });

    it("should return null if doctor not found", async () => {
      doctorRepositoryMock.findById.mockResolvedValueOnce(null);

      const result = await doctorService.getDoctorById(999);

      expect(result).toBeNull();
    });
  });

  describe("createDoctor", () => {
    it("should create a doctor with valid data", async () => {
      const doctorData = {
        email: "doctor@hospital.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        licenseNumber: "LIC123",
      };

      const hashedPassword = "hashed_password";
      const createdUser: User = {
        id: 1,
        email: "doctor@hospital.com",
        password: hashedPassword,
        role: "doctor",
        isActive: true,
      };

      const createdDoctor: Doctor = {
        id: 1,
        userId: 1,
        firstName: "John",
        lastName: "Doe",
        licenseNumber: "LIC123",
      };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);
      userRepositoryMock.create.mockResolvedValueOnce(createdUser);
      doctorRepositoryMock.create.mockResolvedValueOnce(createdDoctor);

      const result = await doctorService.createDoctor(doctorData);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(userRepositoryMock.create).toHaveBeenCalled();
      expect(doctorRepositoryMock.create).toHaveBeenCalled();
      expect(result).toHaveProperty("id");
    });

    it("should throw error if user creation fails", async () => {
      const doctorData = {
        email: "existing@hospital.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        licenseNumber: "LIC123",
      };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce("hashed");
      userRepositoryMock.create.mockResolvedValueOnce(null as any);

      await expect(doctorService.createDoctor(doctorData)).rejects.toThrow(
        "Failed to create user",
      );
    });
  });

  describe("updateDoctor", () => {
    it("should update a doctor with valid data", async () => {
      const updateData = {
        firstName: "John Updated",
        phone: "111222333",
      };

      const updatedDoctor: Doctor = {
        id: 1,
        userId: 1,
        firstName: "John Updated",
        lastName: "Doe",
        licenseNumber: "LIC123",
        phone: "111222333",
      };

      doctorRepositoryMock.update.mockResolvedValueOnce(updatedDoctor);

      const result = await doctorService.updateDoctor(1, updateData);

      expect(doctorRepositoryMock.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(updatedDoctor);
    });
  });

  describe("deleteDoctor", () => {
    it("should delete a doctor by id", async () => {
      const doctor = {
        id: 1,
        userId: 1,
        firstName: "John",
        lastName: "Doe",
        licenseNumber: "LIC123",
      };

      doctorRepositoryMock.findById.mockResolvedValueOnce(doctor);
      doctorRepositoryMock.delete.mockResolvedValueOnce(true);

      const result = await doctorService.deleteDoctor(1);

      expect(doctorRepositoryMock.findById).toHaveBeenCalledWith(1);
      expect(doctorRepositoryMock.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it("should return false if doctor not found", async () => {
      doctorRepositoryMock.findById.mockResolvedValueOnce(null);

      const result = await doctorService.deleteDoctor(999);

      expect(result).toBe(false);
    });
  });
});