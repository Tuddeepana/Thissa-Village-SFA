export interface Printer {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  type: 'KOT';
  isActive: boolean;
  lastTestedAt: string | null;
  lastTestOk: boolean;
  createdAt: string;
  updatedAt: string;
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
