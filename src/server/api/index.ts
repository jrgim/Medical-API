import { Router } from "express";
import { Service } from "typedi";
import { UserController } from "../../app/users/user.controller";

@Service()
export class Api {
  private apiRouter: Router;

  constructor(private userController: UserController) {
    this.apiRouter = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.apiRouter.use("/users", this.userController.getRouter());
  }

  getApiRouter(): Router {
    return this.apiRouter;
  }
}