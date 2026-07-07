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
    let url = agentUrl;
    if (!url) {
      const config = await getAgentConfig();
      if (config) url = config.url;
    }
    
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
    let url = agentUrl;
    let key = agentKey;
    
    if (!url || !key) {
      const config = await getAgentConfig();
      if (config) {
        url = url || config.url;
        key = key || config.key;
      }
    }
    
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

    const AGENT_TIMEOUT_MS = 8000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);

    try {
      const res = await fetch(`${config.url}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Print-Agent-Key': config.key,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        // Try to extract error message, but guard against non-JSON responses (e.g. ngrok HTML error pages)
        let errorMsg = `Agent returned HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          if (errBody?.message) errorMsg = errBody.message;
        } catch { /* ignore parse errors */ }
        throw new Error(errorMsg);
      }

      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Agent print failed');
      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      // If fetch itself failed (network error, timeout, DNS), the cached agent URL is likely stale
      if (err?.name === 'AbortError') {
        // Timeout — clear cache so next attempt re-fetches the URL
        cachedAgentUrl = null;
        cachedAgentKey = null;
        throw new Error(`Agent print timed out after ${AGENT_TIMEOUT_MS / 1000}s — agent may be offline or URL stale`);
      }
      if (err?.message?.includes('fetch') || err?.message?.includes('NetworkError') || err?.name === 'TypeError') {
        // Network-level failure (e.g., wrong ngrok URL) — invalidate cache
        cachedAgentUrl = null;
        cachedAgentKey = null;
      }
      throw err;
    }
  },
};

