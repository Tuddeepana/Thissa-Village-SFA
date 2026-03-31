import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  selectedModules: string[];
  isLoading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: Boolean(localStorage.getItem('isAuthenticated')),
  user: localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser')!) : null,
  token: localStorage.getItem('authToken'),
  selectedModules: localStorage.getItem('selectedModules') ? JSON.parse(localStorage.getItem('selectedModules')!) : [],
  isLoading: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: any; token: string }>) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      localStorage.setItem('authUser', JSON.stringify(user));
      localStorage.setItem('authToken', token);
      localStorage.setItem('isAuthenticated', 'true');
    },

    setSelectedModules: (state, action: PayloadAction<string[]>) => {
      state.selectedModules = action.payload;
      localStorage.setItem('selectedModules', JSON.stringify(action.payload));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.selectedModules = [];

      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('selectedModules');
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, setSelectedModules, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
