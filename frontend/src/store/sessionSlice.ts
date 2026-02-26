import type { StateCreator } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Optional, Team } from "~/domain";

export type SessionSliceState = {
  isAuthenticated: boolean;
  activeTeam?: Optional<Team>;
};

export type SessionSliceActions = {
  setActiveTeam: (team: Optional<Team>) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
};

const initialState: SessionSliceState = {
  isAuthenticated: false,
  activeTeam: undefined,
};

export type SessionSlice = SessionSliceState & SessionSliceActions;

export const createSessionSlice: StateCreator<
  SessionSlice,
  [],
  [["zustand/immer", never]]
> = immer((set) => ({
  ...initialState,
  setIsAuthenticated: (isAuthenticated) =>
    set((state) => {
      state.isAuthenticated = isAuthenticated;
    }),
  setActiveTeam: (team) =>
    set((state) => {
      state.activeTeam = team;
    }),
}));
