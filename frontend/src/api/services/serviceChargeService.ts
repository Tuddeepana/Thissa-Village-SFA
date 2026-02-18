import api from '../client';
import type { ServiceCharge, UpdateServiceChargeInput } from '@/types/service-charge';

export const serviceChargeService = {
  async get(): Promise<ServiceCharge> {
    const response = await api.get<{ success: boolean; data: ServiceCharge }>('/service-charge');
    return response.data.data;
  },

  async update(input: UpdateServiceChargeInput): Promise<ServiceCharge> {
    const response = await api.put<{ success: boolean; data: ServiceCharge; message: string }>(
      '/service-charge',
      input
    );
    return response.data.data;
  },
};

