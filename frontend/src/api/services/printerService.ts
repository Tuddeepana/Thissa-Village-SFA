import api from '../client';
import { ENDPOINTS } from '../endpoints';
import type { Printer, CreatePrinterInput, UpdatePrinterInput } from '@/types/printer.types';
import { configService } from './configService';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Cache agent config for the session to avoid repeated DB calls
let cachedAgentUrl: string | null = null;
let cachedAgentKey: string | null = null;

async function getAgentConfig(): Promise<{ url: string; key: string } | null> {
  if (cachedAgentUrl && cachedAgentKey) {
    return { url: cachedAgentUrl, key: cachedAgentKey };
  }

  try {
    const [urlConfig, keyConfig] = await Promise.all([
      configService.get('PRINT_AGENT_URL'),
      configService.get('PRINT_AGENT_KEY'),
    ]);

    if (!urlConfig.value || !keyConfig.value) return null;

    cachedAgentUrl = urlConfig.value.replace(/\/+$/, ''); // remove trailing slash
    cachedAgentKey = keyConfig.value;
    return { url: cachedAgentUrl, key: cachedAgentKey };
  } catch {
    return null;
  }
}

/** Clear cached agent config (call when user updates settings) */
export function clearAgentConfigCache() {
  cachedAgentUrl = null;
  cachedAgentKey = null;
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

  // ── Print Agent Methods ──────────────────────────────────────

  /** Check if the print agent is online */
  async checkAgentHealth(agentUrl?: string, agentKey?: string): Promise<{ status: string; printer: any }> {
    const url = agentUrl || cachedAgentUrl;
    if (!url) throw new Error('Agent URL not configured');

    const res = await fetch(`${url}/health`, {
      method: 'GET',
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    if (!res.ok) throw new Error(`Agent health check failed: ${res.status}`);
    return res.json();
  },

  /** Send test print via the agent */
  async testAgentPrint(agentUrl?: string, agentKey?: string): Promise<{ success: boolean; message: string }> {
    const url = agentUrl || cachedAgentUrl;
    const key = agentKey || cachedAgentKey;
    if (!url || !key) throw new Error('Agent URL or key not configured');

    const res = await fetch(`${url}/print-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Print-Agent-Key': key,
        'ngrok-skip-browser-warning': 'true',
      },
    });
    return res.json();
  },

  /** Print a KOT via the agent */
  async printKotViaAgent(data: any): Promise<{ success: boolean; message: string }> {
    const config = await getAgentConfig();
    if (!config) throw new Error('Agent not configured');

    const res = await fetch(`${config.url}/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Print-Agent-Key': config.key,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Agent print failed');
    return result;
  },
};

