import api from '../client';
import { ENDPOINTS } from '../endpoints';
import type { Printer, CreatePrinterInput, UpdatePrinterInput } from '@/types/printer.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const printerService = {
  async getAll(): Promise<Printer[]> {
    const response = await api.get<ApiResponse<Printer[]>>(ENDPOINTS.printers.base);
    return response.data.data;
  },

  async getById(id: string): Promise<Printer> {
    const response = await api.get<ApiResponse<Printer>>(ENDPOINTS.printers.byId(id));
    return response.data.data;
  },

  async create(input: CreatePrinterInput): Promise<Printer> {
    const response = await api.post<ApiResponse<Printer>>(ENDPOINTS.printers.base, input);
    return response.data.data;
  },

  async update(id: string, input: UpdatePrinterInput): Promise<Printer> {
    const response = await api.put<ApiResponse<Printer>>(ENDPOINTS.printers.byId(id), input);
    return response.data.data;
  },

  async delete(id: string): Promise<Printer> {
    const response = await api.delete<ApiResponse<Printer>>(ENDPOINTS.printers.byId(id));
    return response.data.data;
  },

  async testPrint(id: string): Promise<{ success: boolean; message: string; data: Printer }> {
    const response = await api.post<{ success: boolean; message: string; data: Printer }>(
      ENDPOINTS.printers.test(id)
    );
    return response.data;
  },

  async printKot(data: any): Promise<{ success: boolean; message: string; prints?: string[] }> {
    const response = await api.post<{ success: boolean; message: string; prints?: string[] }>(
      ENDPOINTS.printers.printKot,
      data
    );
    return response.data;
  },
};
