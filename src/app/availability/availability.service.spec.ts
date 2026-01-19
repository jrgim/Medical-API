import "reflect-metadata";
import { Container } from "typedi";
import { AvailabilityService } from "./availability.service";
import { AvailabilityRepository } from "./availability.repository";

describe("AvailabilityService", () => {
  let availabilityService: AvailabilityService;
  let availabilityRepositoryMock: jest.Mocked<AvailabilityRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    availabilityRepositoryMock = {
      findByDoctorId: jest.fn(),
      bulkCreate: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<AvailabilityRepository>;

    Container.set(AvailabilityRepository, availabilityRepositoryMock);
    availabilityService = Container.get(AvailabilityService);
  });

  describe("getDoctorAvailability", () => {
    it("should return availability slots", async () => {
      const slots = [
        {
          id: 1,
          doctorId: 1,
          dayOfWeek: "Monday",
          time: "10:00",
          isAvailable: true,
        },
      ];

      availabilityRepositoryMock.findByDoctorId.mockResolvedValueOnce(
        slots as any,
      );

      const result = await availabilityService.getDoctorAvailability(
        1,
        "2023-10-10",
      );

      expect(availabilityRepositoryMock.findByDoctorId).toHaveBeenCalledWith(
        1,
        "2023-10-10",
      );
      expect(result).toEqual(slots);
    });
  });

  describe("setAvailability", () => {
    it("should create availability slots", async () => {
      const createDto = [{ doctorId: 1, dayOfWeek: "Monday", time: "10:00" }];
      const created = [{ id: 1, ...createDto[0], isAvailable: true }];

      availabilityRepositoryMock.bulkCreate.mockResolvedValueOnce(
        created as any,
      );

      const result = await availabilityService.setAvailability(
        1,
        createDto as any,
      );

      expect(result).toEqual(created);
    });
  });

  describe("updateSlot", () => {
    it("should update availability slot", async () => {
      const updateDto = { isAvailable: false };
      const updated = { id: 1, doctorId: 1, isAvailable: false };

      availabilityRepositoryMock.update.mockResolvedValueOnce(updated as any);

      const result = await availabilityService.updateSlot(1, updateDto);

      expect(result).toEqual(updated);
    });
  });

  describe("deleteSlot", () => {
    it("should delete availability slot", async () => {
      availabilityRepositoryMock.delete.mockResolvedValueOnce(true);

      const result = await availabilityService.deleteSlot(1);

      expect(result).toBe(true);
    });
  });
});