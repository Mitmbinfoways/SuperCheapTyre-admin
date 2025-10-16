import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
};

export interface AuthState {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  admin:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("adminUser") || "null")
      : null,
  token:
    typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null,
  isAuthenticated:
    typeof window !== "undefined" && !!sessionStorage.getItem("authToken"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ admin: AdminUser; token: string }>,
    ) {
      const { admin, token } = action.payload;
      state.admin = admin;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem("adminUser", JSON.stringify(admin));
      sessionStorage.setItem("authToken", token);
    },
    logout(state) {
      state.admin = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("adminUser");
      sessionStorage.removeItem("authToken");
    },
    updateAdmin(state, action: PayloadAction<Partial<AdminUser>>) {
      if (state.admin) {
        state.admin = { ...state.admin, ...action.payload };
        localStorage.setItem("adminUser", JSON.stringify(state.admin));
      }
    },
  },
});

export const { setCredentials, logout, updateAdmin } = authSlice.actions;
export const authReducer = authSlice.reducer;
