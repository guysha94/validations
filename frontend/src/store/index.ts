import { createJSONStorage, devtools, persist } from "zustand/middleware";
import {
  createEventSlice,
  type EventSliceActions,
  type EventSliceState,
} from "~/store/eventSlice";
import {
  createSessionSlice,
  type SessionSliceActions,
  type SessionSliceState,
} from "~/store/sessionSlice";
import { create } from "./storage";

export { resetAllStores } from "./storage";

export type StoreState = SessionSliceState & EventSliceState;
export type StoreActions = SessionSliceActions & EventSliceActions;
export type Store = StoreState & StoreActions;

export const useStore = create<Store>()(
  devtools(
    persist(
      (...a) => ({
        ...createSessionSlice(...a),
        ...createEventSlice(...a),
      }),
      {
        name: "store",
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
);
