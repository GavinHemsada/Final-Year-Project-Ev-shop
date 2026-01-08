import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import type { UserRole } from "@/types";

interface Ids {
  userid?: string;
  sellerid?: string;
  financeid?: string;
  adminid?: string;
}

interface User {
  userid: string;
  roles: UserRole[];
  activeRole: UserRole;
  ids: Ids;
}

interface AuthState {
  user: User | null;
}

const initialState: AuthState = {
  user: (() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  })(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserData: (
      state,
      action: PayloadAction<{
        userid: string;
        roles: UserRole[];
        ids: Ids;
      }>
    ) => {
      const { userid, roles, ids } = action.payload;
      state.user = {
        userid,
        roles,
        activeRole: roles[0],
        ids,
      };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    setActiveRole: (state, action: PayloadAction<UserRole>) => {
      if (state.user && state.user.roles.includes(action.payload)) {
        state.user.activeRole = action.payload;
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    setSellerId: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.ids.sellerid = action.payload;
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    setFinanceId: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.ids.financeid = action.payload;
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    setAdminId: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.ids.adminid = action.payload;
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    addNewRole: (state, action: PayloadAction<UserRole>) => {
      if (state.user && !state.user.roles.includes(action.payload)) {
        state.user.roles.push(action.payload);
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
  },
});

export const {
  setUserData,
  setActiveRole,
  setSellerId,
  setFinanceId,
  setAdminId,
  addNewRole,
  logout,
} = authSlice.actions;

export const selectUser = (state: RootState) => state.auth.user;
export const selectUserId = (state: RootState) => state.auth.user?.userid ?? null;
export const selectSellerId = (state: RootState) => state.auth.user?.ids?.sellerid ?? null;
export const selectFinanceId = (state: RootState) => state.auth.user?.ids?.financeid ?? null;
export const selectActiveRole = (state: RootState) => state.auth.user?.activeRole ?? null;
export const selectActiveRoleId = (state: RootState) => {
  if (!state.auth.user) return null;
  switch (state.auth.user.activeRole) {
    case "seller":
      return state.auth.user.ids.sellerid ?? null;
    case "finance":
      return state.auth.user.ids.financeid ?? null;
    case "admin":
      return state.auth.user.ids.adminid ?? null;
    case "user":
    default:
      return state.auth.user.ids.userid ?? null;
  }
};
export const selectRoles = (state: RootState) => state.auth.user?.roles;

export default authSlice.reducer;
