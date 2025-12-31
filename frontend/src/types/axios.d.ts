import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    meta?: {
      showLoader?: 'global' | 'local' | 'none';
      loaderKey?: string;
    };
    // internal marker used by interceptors
    __loader?: { type: 'global' } | { type: 'local'; key: string } | { type: 'none' };
  }
}
