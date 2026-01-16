export interface Doctor {
    id?: number;
    userId: number;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    phone?: string;
    bio?: string;
    consultationFee?: number;
    yearsOfExperience?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DoctorCreateDto {
    userId: number;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    phone?: string;
    bio?: string;
    consultationFee?: number;
    yearsOfExperience?: number;
}

export interface DoctorUpdateDto {
    firstName?: string;
    lastName?: string;
    licenseNumber?: string;
    phone?: string;
    bio?: string;
    consultationFee?: number;
    yearsOfExperience?: number;
}

export interface DoctorWithSpecialties extends Doctor {
    specialties?: Array<{
        id: number;
        name: string;
    }>;
}