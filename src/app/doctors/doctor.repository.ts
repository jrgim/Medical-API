import { Service } from "typedi";
import { Doctor, DoctorCreateDto, DoctorUpdateDto, DoctorWithSpecialties } from "./doctor.model";
import { DatabaseService } from "../../database/database.service";

@Service()
export class DoctorRepository {
    constructor(private readonly databaseService: DatabaseService) {}

    async findAll(filters: { specialtyId?: string; date?: string } = {}): Promise<DoctorWithSpecialties[]> {
        const params: any[] = [];
        let whereClause = "";
        let havingClause = "";
        const conditions: string[] = [];

        if (filters.date) {
        conditions.push(`
            EXISTS (
            SELECT 1 FROM availabilities a 
            WHERE a.doctorId = d.id 
            AND DATE(a.startTime) = ? 
            AND a.appointmentId IS NULL
            )
        `);
        params.push(filters.date);
        }

        if (conditions.length > 0) {
        whereClause = "WHERE " + conditions.join(" AND ");
        }

        if (filters.specialtyId) {
        if (whereClause) {
            whereClause += " AND ";
        } else {
            whereClause = "WHERE ";
        }
        whereClause += `
                EXISTS (
                    SELECT 1 FROM doctorSpecialties ds_filter
                    WHERE ds_filter.doctorId = d.id
                    AND ds_filter.specialtyId = ?
                )
            `;
        params.push(filters.specialtyId);
        }

        const result = await this.databaseService.execQuery({
        sql: `
            SELECT 
            d.*,
            u.email, u.role, u.isActive,
            u.createdAt as userCreatedAt, u.updatedAt as userUpdatedAt,
            GROUP_CONCAT(s.id) as specialtyIds,
            GROUP_CONCAT(s.name) as specialtyNames
            FROM doctors d
            LEFT JOIN users u ON d.userId = u.id
            LEFT JOIN doctorSpecialties ds ON d.id = ds.doctorId
            LEFT JOIN specialties s ON ds.specialtyId = s.id
            ${whereClause}
            GROUP BY d.id
            ORDER BY d.id DESC
        `,
        params: params,
        });

        return result.rows.map((row) => this.mapDoctorWithSpecialties(row));
    }

    async findById(id: number): Promise<DoctorWithSpecialties | null> {
        const result = await this.databaseService.execQuery({
        sql: `
            SELECT 
            d.*,
            u.email, u.role, u.isActive,
            u.createdAt as userCreatedAt, u.updatedAt as userUpdatedAt,
            GROUP_CONCAT(s.id) as specialtyIds,
            GROUP_CONCAT(s.name) as specialtyNames
            FROM doctors d
            LEFT JOIN users u ON d.userId = u.id
            LEFT JOIN doctorSpecialties ds ON d.id = ds.doctorId
            LEFT JOIN specialties s ON ds.specialtyId = s.id
            WHERE d.id = ?
            GROUP BY d.id
        `,
        params: [id],
        });

        if (result.rows.length === 0) return null;
        return this.mapDoctorWithSpecialties(result.rows[0]);
    }

    async findByUserId(userId: number): Promise<Doctor | null> {
        const result = await this.databaseService.execQuery({
        sql: "SELECT * FROM doctors WHERE userId = ?",
        params: [userId],
        });
        return result.rows[0] || null;
    }

    async create(doctorData: DoctorCreateDto): Promise<Doctor> {
        await this.databaseService.execQuery({
        sql: `
            INSERT INTO doctors (
            userId, firstName, lastName, licenseNumber, phone, bio, consultationFee, yearsOfExperience
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
            doctorData.userId,
            doctorData.firstName,
            doctorData.lastName,
            doctorData.licenseNumber,
            doctorData.phone || null,
            doctorData.bio || null,
            doctorData.consultationFee || null,
            doctorData.yearsOfExperience || 0,
        ],
        });

        const result = await this.databaseService.execQuery({
        sql: "SELECT * FROM doctors WHERE id = last_insert_rowid()",
        params: [],
        });
        return result.rows[0];
    }

    async update(
        id: number,
        doctorData: DoctorUpdateDto
    ): Promise<Doctor | null> {
        const doctor = await this.findById(id);
        if (!doctor) return null;

        const updates: string[] = [];
        const params: any[] = [];

        if (doctorData.firstName !== undefined) {
        updates.push("firstName = ?");
        params.push(doctorData.firstName);
        }
        if (doctorData.lastName !== undefined) {
        updates.push("lastName = ?");
        params.push(doctorData.lastName);
        }
        if (doctorData.licenseNumber !== undefined) {
        updates.push("licenseNumber = ?");
        params.push(doctorData.licenseNumber);
        }
        if (doctorData.phone !== undefined) {
        updates.push("phone = ?");
        params.push(doctorData.phone);
        }
        if (doctorData.bio !== undefined) {
        updates.push("bio = ?");
        params.push(doctorData.bio);
        }
        if (doctorData.consultationFee !== undefined) {
        updates.push("consultationFee = ?");
        params.push(doctorData.consultationFee);
        }
        if (doctorData.yearsOfExperience !== undefined) {
        updates.push("yearsOfExperience = ?");
        params.push(doctorData.yearsOfExperience);
        }

        if (updates.length === 0) {
        const result = await this.databaseService.execQuery({
            sql: "SELECT * FROM doctors WHERE id = ?",
            params: [id],
        });
        return result.rows[0];
        }

        params.push(id);
        await this.databaseService.execQuery({
        sql: `UPDATE doctors SET ${updates.join(", ")} WHERE id = ?`,
        params,
        });

        const result = await this.databaseService.execQuery({
        sql: "SELECT * FROM doctors WHERE id = ?",
        params: [id],
        });
        return result.rows[0];
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.databaseService.execQuery({
        sql: "DELETE FROM doctors WHERE id = ?",
        params: [id],
        });
        return result.rowCount > 0;
    }

    async addSpecialty(doctorId: number, specialtyId: number): Promise<void> {
        await this.databaseService.execQuery({
        sql: "INSERT OR IGNORE INTO doctorSpecialties (doctorId, specialtyId) VALUES (?, ?)",
        params: [doctorId, specialtyId],
        });
    }

    async removeSpecialty(doctorId: number, specialtyId: number): Promise<void> {
        await this.databaseService.execQuery({
        sql: "DELETE FROM doctorSpecialties WHERE doctorId = ? AND specialtyId = ?",
        params: [doctorId, specialtyId],
        });
    }

    private mapDoctorWithSpecialties(row: any): DoctorWithSpecialties {
        const specialties: { id: number; name: string }[] = [];
        if (row.specialtyIds && row.specialtyNames) {
        const ids = row.specialtyIds.split(",");
        const names = row.specialtyNames.split(",");
        for (let i = 0; i < ids.length; i++) {
            specialties.push({ id: parseInt(ids[i]), name: names[i] });
        }
        }

        return {
        id: row.id,
        userId: row.userId,
        firstName: row.firstName || "",
        lastName: row.lastName || "",
        licenseNumber: row.licenseNumber,
        phone: row.phone,
        bio: row.bio,
        consultationFee: row.consultationFee,
        yearsOfExperience: row.yearsOfExperience,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        specialties,
        };
    }
}