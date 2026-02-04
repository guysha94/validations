import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {createJSONStorage, persist} from 'zustand/middleware'
import {ValidationErrorInfo} from "~/domain";

type State = {

    addFormOpen: boolean;
    currentEvent: { id: string, type: string, label: string } | null | undefined;
    currentTab: string | null | undefined;
    isFetchingRules: boolean;
    testResults: ValidationErrorInfo[]
}

type Actions = {
    toggleAddFormOpen: () => void;
    setCurrentEvent: (eventType: { id: string, type: string, label: string } | null | undefined) => void;
    setIsFetchingRules: (isFetching: boolean) => void;
    setCurrentTab: (tab: string | null | undefined) => void;
}

type Store = State & Actions;

const initialState: State = {
    addFormOpen: false,
    currentEvent: null,
    currentTab: null,
    isFetchingRules: false,
    testResults: [],
}

export const useValidationsStore = create<Store>()(
    persist(immer((set) => ({
            ...initialState,
            toggleAddFormOpen: () =>
                set((state) => {
                    state.addFormOpen = !state.addFormOpen
                }),
            setCurrentEvent: (eventType: { id: string, type: string, label: string } | null | undefined) =>
                set((state) => {
                    state.currentEvent = eventType
                }),
            setIsFetchingRules: (isFetching: boolean) =>
                set((state) => {
                    state.isFetchingRules = isFetching
                }),
            setCurrentTab: (tab: string | null | undefined) =>
                set((state) => {
                    state.currentTab = tab
                }),

        })), {
            name: 'validations-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
)