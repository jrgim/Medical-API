import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";
import { Service } from "typedi";
import { config } from "../config/environment";
import path from "path";
import { DBQuery } from "./models/db-query";
import { DBQueryResult } from "./models/db-query-result";

@Service()
export class DatabaseService {
  private db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

  public async openDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
    if (this.db) {
      return this.db;
    }

    const filename =
      config.dbOptions.database === ":memory:"
        ? ":memory:"
        : path.join(__dirname, `../data/${config.dbOptions.database}`);

    this.db = await open({
      filename: filename,
      driver: sqlite3.Database,
    });

    await this.db.exec(`PRAGMA foreign_keys = ON;`);

    console.log("Database connection established");
    return this.db;
  }


  public async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log("Database connection closed");
    }
  }

  /**
   * Esta función tiene el objetivo de ejecutar una determinada consulta SQL y
   * devolver los resultados de la ejecución.
   */
  public async execQuery(query: DBQuery): Promise<DBQueryResult> {
    const dbClient = await this.openDatabase();
    const { sql, params } = query;

    try {
      const rows: [] = await dbClient.all(sql, params);
      // num de cambios
      let rowCount = rows.length;
      let lastID: number | undefined = undefined;

      if (
        sql.trim().toUpperCase().startsWith("DELETE") ||
        sql.trim().toUpperCase().startsWith("UPDATE") ||
        sql.trim().toUpperCase().startsWith("INSERT")
      ) {
        const changes = await dbClient.get("SELECT changes() as changes");
        rowCount = changes?.changes || 0;

        // Para INSERT, obtener el último ID insertado
        if (sql.trim().toUpperCase().startsWith("INSERT")) {
          const lastInsert = await dbClient.get(
            "SELECT last_insert_rowid() as lastID"
          );
          lastID = lastInsert?.lastID;
        }
      }

      return { rows: rows, rowCount: rowCount, lastID: lastID };
    } finally {
      if (config.dbOptions.database !== ":memory:") {
        await this.closeDatabase();
      }
    }
  }


  public async initializeDatabase(): Promise<void> {
    await this.openDatabase();

    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'admin')),
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        phone TEXT,
        location TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS specialties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        departmentId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(departmentId) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);

    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL UNIQUE,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        dni TEXT UNIQUE,
        phone TEXT,
        dateOfBirth DATE,
        gender TEXT CHECK(gender IN ('male', 'female', 'other')),
        address TEXT,
        city TEXT,
        country TEXT,
        postalCode TEXT,
        allergies TEXT,
        insuranceNumber TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL UNIQUE,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        licenseNumber TEXT NOT NULL UNIQUE,
        phone TEXT,
        bio TEXT,
        consultationFee REAL,
        yearsOfExperience INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS doctorSpecialties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctorId INTEGER NOT NULL,
        specialtyId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(doctorId) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY(specialtyId) REFERENCES specialties(id) ON DELETE CASCADE,
        UNIQUE(doctorId, specialtyId)
      )
    `);

    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS availabilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctorId INTEGER NOT NULL,
        dayOfWeek INTEGER NOT NULL CHECK(dayOfWeek >= 0 AND dayOfWeek <= 6),
        startTime TIME NOT NULL,
        endTime TIME NOT NULL,
        appointmentId INTEGER,
        isAvailable BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(doctorId) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY(appointmentId) REFERENCES appointments(id) ON DELETE SET NULL
      )
    `);

    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId INTEGER NOT NULL,
        doctorId INTEGER NOT NULL,
        appointmentDate DATE NOT NULL,
        appointmentTime TIME NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
        reason TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patientId) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY(doctorId) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);

    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS medicalRecords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId INTEGER NOT NULL,
        doctorId INTEGER NOT NULL,
        appointmentId INTEGER,
        diagnosis TEXT NOT NULL,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patientId) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY(doctorId) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY(appointmentId) REFERENCES appointments(id) ON DELETE SET NULL
      )
    `);

    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS treatments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicalRecordId INTEGER NOT NULL,
        medication TEXT NOT NULL,
        duration TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(medicalRecordId) REFERENCES medicalRecords(id) ON DELETE CASCADE
      )
    `);

    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS testResults (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicalRecordId INTEGER NOT NULL,
        testName TEXT NOT NULL,
        testDate DATE,
        result TEXT,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(medicalRecordId) REFERENCES medicalRecords(id) ON DELETE CASCADE
      )
    `);

    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('appointment', 'reminder', 'system', 'alert')),
        isRead BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS auditLogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        action TEXT NOT NULL,
        entityType TEXT NOT NULL,
        entityId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log("Database tables initialized");
  }
}

export const databaseService = new DatabaseService();