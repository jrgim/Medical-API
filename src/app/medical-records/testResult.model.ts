export interface TestResult {
  id?: number;
  medicalRecordId: number;
  testName: string;
  testDate?: Date;
  result?: string;
  notes?: string;
  createdAt?: Date;
}

export interface TestResultCreateDto {
  medicalRecordId: number;
  testName: string;
  testDate?: Date;
  result?: string;
  notes?: string;
}