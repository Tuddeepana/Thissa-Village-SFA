import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from './api/apiSlice';
import { authSlice } from './slices/authSlice';
import { uiSlice } from './slices/uiSlice';

// Import all API slices to register their endpoints
import './api/authApi';
import './api/productsApi';
import './api/categoriesApi';
import './api/billsApi';
import './api/salesSummaryApi';
import './api/inventoryApi';
import './api/dashboardApi';

export const store = configureStore({
  reducer: {
    api: apiSlice.reducer,
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(apiSlice.middleware),
});

// Enable listener behavior for the store
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
