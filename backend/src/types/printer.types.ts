export interface PrinterDTO {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  type: 'KOT';
  isActive: boolean;
  lastTestedAt: Date | null;
  lastTestOk: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePrinterInput {
  name: string;
  ipAddress: string;
  port?: number;
  type?: 'KOT';
}

export interface UpdatePrinterInput {
  name?: string;
  ipAddress?: string;
  port?: number;
  isActive?: boolean;
}
