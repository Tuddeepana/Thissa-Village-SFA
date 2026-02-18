export interface ServiceChargeDTO {
  id: string;
  percentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateServiceChargeInput {
  percentage?: number;
  isActive?: boolean;
}

