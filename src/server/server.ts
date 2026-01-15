import { json, urlencoded } from "body-parser";
import { Application } from "express";
import { Service } from "typedi";
import cors from "cors";
import express from "express";
import { Api } from "./api";

@Service()
export class Server {
  app: Application;

  constructor(private readonly api: Api) {
    this.app = express();
    this.setupServer();
  }

  private setupServer(): void {
    this.app.use(cors());
    this.app.use(json({ limit: "5mb" }));
    this.app.use(urlencoded({ extended: false }));

    this.app.use("/api", this.api.getApiRouter());
  }

  listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }
}