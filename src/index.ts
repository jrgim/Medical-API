import "reflect-metadata";
import dotenv from "dotenv";
import { Container } from "typedi";
import { Server } from "./server/server";
import { databaseService } from "./database";

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function startServer() {
  try {
    await databaseService.openDatabase();
    console.log("Database connected.");

    await databaseService.initializeDatabase();
    console.log("Database initialized.");

    const server = Container.get(Server);
    server.listen(PORT);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}

startServer();