import type { StateCreator } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { EventWithRules, Optional, ValidationErrorInfo } from "~/domain";

export type EventSliceState = {
  activeEvent?: Optional<EventWithRules>;
  testResults: ValidationErrorInfo[];
};

export type EventSliceActions = {
  setActiveEvent: (team: Optional<EventWithRules>) => void;
  setTestResults: (results: ValidationErrorInfo[]) => void;
};

const initialState: EventSliceState = {
  activeEvent: undefined,
  testResults: [],
};

export type EventSlice = EventSliceState & EventSliceActions;

export const createEventSlice: StateCreator<
  EventSlice,
  [],
  [["zustand/immer", never]]
> = immer((set) => ({
  ...initialState,
  setActiveEvent: (event) =>
    set((state) => {
      if (state.activeEvent?.type !== event?.type) {
        state.testResults = [];
      }
      state.activeEvent = event;
    }),
  setTestResults: (results) =>
    set((state) => {
      state.testResults = results;
    }),
}));
