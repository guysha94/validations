import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {createJSONStorage, persist} from 'zustand/middleware'
import {ValidationErrorInfo} from "~/domain";
import {EventsSchema} from "~/lib/db/schemas";


export type Tab = 'schema' | 'rules' | 'test';

type State = {

    addFormOpen: boolean;
    currentEvent: EventsSchema | null | undefined;
    currentTab: Tab;
    isFetchingRules: boolean;
    testResults: Record<string, ValidationErrorInfo[]>;
}

type Actions = {
    toggleAddFormOpen: () => void;
    setCurrentEvent: (event: EventsSchema | null | undefined) => void;
    setIsFetchingRules: (isFetching: boolean) => void;
    setCurrentTab: (tab: Tab) => void;
    setTestResults: (eventType: string, results: ValidationErrorInfo[]) => void;
}

type Store = State & Actions;

const initialState: State = {
    addFormOpen: false,
    currentEvent: null,
    currentTab: "schema",
    isFetchingRules: false,
    testResults: {},
}

export const useValidationsStore = create<Store>()(
    persist(immer((set) => ({
            ...initialState,
            toggleAddFormOpen: () =>
                set((state) => {
                    state.addFormOpen = !state.addFormOpen
                }),
            setCurrentEvent: (event: EventsSchema | null | undefined) =>
                set((state) => {
                    state.currentEvent = event
                }),
            setIsFetchingRules: (isFetching: boolean) =>
                set((state) => {
                    state.isFetchingRules = isFetching
                }),
            setCurrentTab: (tab: Tab) =>
                set((state) => {
                    state.currentTab = tab
                }),
            setTestResults: (eventType: string, results: ValidationErrorInfo[]) =>
                set((state) => {
                    state.testResults[eventType] = results;
                }),

        })), {
            name: 'validations-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
)