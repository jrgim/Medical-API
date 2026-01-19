import "reflect-metadata";
import { Container } from "typedi";
import { PatientService } from "./patient.service";
import { PatientRepository } from "./patient.repository";
import { UserRepository } from "../users/user.repository";
import { Patient, PatientCreateDto, PatientUpdateDto } from "./patient.model";
import bcrypt from "bcryptjs";

jest.mock("bcryptjs");

describe("PatientService", () => {
  let patientService: PatientService;
  let patientRepositoryMock: jest.Mocked<PatientRepository>;
  let userRepositoryMock: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    patientRepositoryMock = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findPatientsByDoctorId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<PatientRepository>;

    userRepositoryMock = {
      create: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    Container.set(PatientRepository, patientRepositoryMock);
    Container.set(UserRepository, userRepositoryMock);

    patientService = Container.get(PatientService);
  });

  describe("getAllPatients", () => {
    it("should return all patients", async () => {
      const patients: Patient[] = [
        {
          id: 1,
          userId: 1,
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: new Date("1990-01-01"),
        },
      ];

      patientRepositoryMock.findAll.mockResolvedValueOnce(patients);

      const result = await patientService.getAllPatients();

      expect(patientRepositoryMock.findAll).toHaveBeenCalled();
      expect(result).toEqual(patients);
    });
  });

  describe("getPatientById", () => {
    it("should return patient by id", async () => {
      const patient: Patient = {
        id: 1,
        userId: 1,
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: new Date("1990-01-01"),
      };

      patientRepositoryMock.findById.mockResolvedValueOnce(patient);

      const result = await patientService.getPatientById(1);

      expect(patientRepositoryMock.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(patient);
    });
  });

  describe("createPatient", () => {
    it("should create patient with user account", async () => {
      const createData = {
        email: "patient@test.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "1990-01-01",
      };
      const hashedPassword = "hashed_password";
      const user = { id: 1, email: "patient@test.com", role: "patient" };
      const patient = { id: 1, userId: 1, firstName: "John", lastName: "Doe" };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);
      userRepositoryMock.create.mockResolvedValueOnce(user as any);
      patientRepositoryMock.create.mockResolvedValueOnce(patient as any);

      const result = await patientService.createPatient(createData);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(userRepositoryMock.create).toHaveBeenCalled();
      expect(patientRepositoryMock.create).toHaveBeenCalled();
      expect(result).toHaveProperty("id");
    });

    it("should throw error if user creation fails", async () => {
      const createData = {
        email: "patient@test.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      };

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce("hashed");
      userRepositoryMock.create.mockResolvedValueOnce(null as any);

      await expect(patientService.createPatient(createData)).rejects.toThrow(
        "Failed to create user",
      );
    });
  });

  describe("updatePatient", () => {
    it("should update patient", async () => {
      const updateDto: PatientUpdateDto = { phone: "123456789" };
      const updatedPatient: Patient = {
        id: 1,
        userId: 1,
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: new Date("1990-01-01"),
        phone: "123456789",
      };

      patientRepositoryMock.update.mockResolvedValueOnce(updatedPatient);

      const result = await patientService.updatePatient(1, updateDto);

      expect(patientRepositoryMock.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updatedPatient);
    });
  });

  describe("deletePatient", () => {
    it("should delete patient", async () => {
      const patient = { id: 1, userId: 1, firstName: "John", lastName: "Doe" };

      patientRepositoryMock.findById.mockResolvedValueOnce(patient as any);
      patientRepositoryMock.delete.mockResolvedValueOnce(true);

      const result = await patientService.deletePatient(1);

      expect(patientRepositoryMock.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it("should throw error if patient not found", async () => {
      patientRepositoryMock.findById.mockResolvedValueOnce(null);

      await expect(patientService.deletePatient(999)).rejects.toThrow(
        "Patient not found",
      );
    });
  });
});