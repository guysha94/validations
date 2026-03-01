import type {StateCreator} from "zustand";
import {immer} from "zustand/middleware/immer";
import type {Optional, Team} from "~/domain";

export type SessionSliceState = {
    isAuthenticated: boolean;
    activeTeam?: Optional<Team>;
    isNewEventDialogOpen: boolean;
};

export type SessionSliceActions = {
    setActiveTeam: (team: Optional<Team>) => void;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    toggleIsNewEventDialogOpen: () => void;
    setIsNewEventDialogOpen: (isOpen: boolean) => void;
};

const initialState: SessionSliceState = {
    isAuthenticated: false,
    activeTeam: undefined,
    isNewEventDialogOpen: false,
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
    toggleIsNewEventDialogOpen: () => set((state) => {
        state.isNewEventDialogOpen = !state.isNewEventDialogOpen;
    }),
    setIsNewEventDialogOpen: (isOpen) => set((state) => {
        state.isNewEventDialogOpen = isOpen;
    }),
}));
