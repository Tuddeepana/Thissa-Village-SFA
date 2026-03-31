import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    return headers;
  },
});

/**
 * Wrapper that converts all query `params` values to strings before
 * passing them to fetchBaseQuery. This is required because Express/Zod
 * expects query-string values to be strings, but RTK Query may
 * serialize JS numbers as JSON numbers.
 */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  // If args is an object with params, stringify every value
  if (typeof args === 'object' && args.params) {
    console.log('=== RTK Query Params Before Stringify ===');
    console.log('Original params:', args.params);

    const stringified: Record<string, string> = {};
    for (const [key, value] of Object.entries(args.params)) {
      if (value !== undefined && value !== null && value !== '') {
        stringified[key] = String(value);
      }
    }

    console.log('Stringified params:', stringified);
    console.log('=========================================');

    args = { ...args, params: stringified };
  }

  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Token expired or invalid - logout user
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/auth';
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'User',
    'Category',
    'Product',
    'Bill',
    'Invoice',
    'Inventory',
    'SalesSummary',
    'Dashboard',
    'Auth'
  ],
  endpoints: () => ({}),
});

export const {
  // We'll export specific hooks as we add them
} = apiSlice;
