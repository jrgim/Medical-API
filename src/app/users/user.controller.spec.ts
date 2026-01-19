import "reflect-metadata";
import request from "supertest";
import express from "express";
import { Container } from "typedi";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { json } from "body-parser";
import * as AuthMiddleware from "../../server/middlewares/auth.middleware";
import * as RoleMiddleware from "../../server/middlewares/authorization.middleware";

describe("UserController", () => {
  let app: express.Express;
  let userServiceMock: jest.Mocked<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    userServiceMock = {
      getAllUsers: jest.fn(),
      searchUsers: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    Container.set(UserService, userServiceMock);

    jest
      .spyOn(AuthMiddleware, "authenticateToken")
      .mockImplementation(async (req, res, next) => {
        (req as any).user = { id: 1, role: "admin" };
        next();
      });

    jest
      .spyOn(RoleMiddleware, "authorizeRole")
      .mockReturnValue((req, res, next) => next());

    const controller = Container.get(UserController);
    app = express();
    app.use(json());
    app.use("/users", controller.getRouter());
  });

  describe("GET /users", () => {
    it("should return users list", async () => {
      const users = [{ id: 1, email: "user@test.com", role: "patient" }];

      userServiceMock.getAllUsers.mockResolvedValueOnce(users as any);

      const res = await request(app).get("/users");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(users);
    });
  });

  describe("GET /users/search", () => {
    it("should search users", async () => {
      const users = [{ id: 1, email: "john@test.com", role: "patient" }];

      userServiceMock.searchUsers.mockResolvedValueOnce(users as any);

      const res = await request(app).get("/users/search?query=john");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(users);
    });

    it("should return 400 if query is missing", async () => {
      const res = await request(app).get("/users/search");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Query parameter is required");
    });
  });
});