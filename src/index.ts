import "reflect-metadata";
import dotenv from "dotenv";
import { Container } from "typedi";
import { Server } from "./server/server";
import { sequelize } from "./database";

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connected.");

    // Only sync without alter to avoid issues with existing data
    await sequelize.sync();
    console.log("Database synced.");

    const server = Container.get(Server);
    server.listen(PORT);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

startServer();