export interface ServiceChargeDTO {
  id: string;
  percentage: number;
  isActive: boolean;
  isKitchenPrintEnabled: boolean;
  kitchenPrinterIp?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateServiceChargeInput {
  percentage?: number;
  isActive?: boolean;
  isKitchenPrintEnabled?: boolean;
  kitchenPrinterIp?: string | null;
}
