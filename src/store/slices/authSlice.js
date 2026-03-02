import { createSlice } from '@reduxjs/toolkit';

// accessToken stored ONLY in Redux (memory) — not localStorage (XSS safe)
// refreshToken is httpOnly cookie (set by backend automatically)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    accessToken: null,
    user: null,      // { name, role }
    isLoading: false,
    error: null,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.error = null;
    },
    refreshSuccess: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const { loginSuccess, refreshSuccess, logout, setLoading, setError, clearError } = authSlice.actions;
export default authSlice.reducer;