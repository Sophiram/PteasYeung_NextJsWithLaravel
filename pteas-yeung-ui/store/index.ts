// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';

// Import all API slices to ensure endpoints are registered
import './api/authApi';
import './api/roomsApi';
import './api/propertiesApi';
import './api/bookingsApi';
import './api/invoicesApi';
import './api/expensesApi';
import './api/usersApi';
import './api/dashboardApi';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
