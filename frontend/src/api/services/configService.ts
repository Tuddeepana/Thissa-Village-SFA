import api from '../client';
import { ENDPOINTS } from '../endpoints';

interface ConfigResponse {
  success: boolean;
  data: { key: string; value: string; updatedAt: string | null };
}

export const configService = {
  async get(key: string): Promise<{ key: string; value: string; updatedAt: string | null }> {
    const response = await api.get<ConfigResponse>(ENDPOINTS.config.byKey(key));
    return response.data.data;
  },

  async set(key: string, value: string): Promise<{ key: string; value: string; updatedAt: string | null }> {
    const response = await api.put<ConfigResponse>(ENDPOINTS.config.byKey(key), { value });
    return response.data.data;
  },
};
