import "client-only";
import {immer} from 'zustand/middleware/immer'
import {createJSONStorage, persist, subscribeWithSelector} from 'zustand/middleware'

import {Optional, SelectEvent, SelectRule, ValidationErrorInfo} from "~/domain";
import {create} from "./storage";


export type Tab = 'schema' | 'rules' | 'test' | 'settings';

type State = {
    addFormOpen: boolean;
    currentEvent: Optional<SelectEvent>;
    currentTab: Tab;
    isFetchingRules: boolean;
    testResults: Record<string, ValidationErrorInfo[]>;
    rules: Record<string, SelectRule[]>;
}

type Actions = {
    toggleAddFormOpen: () => void;
    setCurrentEvent: (event: Optional<SelectEvent>) => void;
    setIsFetchingRules: (isFetching: boolean) => void;
    setCurrentTab: (tab: Tab) => void;
    setTestResults: (eventType: string, results: ValidationErrorInfo[]) => void;
    setRules: (eventType: string, rules: SelectRule[]) => void;
}

type Store = State & Actions;

const initialState: State = {
    addFormOpen: false,
    currentEvent: null,
    currentTab: "schema",
    isFetchingRules: false,
    testResults: {},
    rules: {},
}

export const useValidationsStore = create<Store>()(
    subscribeWithSelector(persist(immer((set) => ({
            ...initialState,
            toggleAddFormOpen: () =>
                set((state) => {
                    state.addFormOpen = !state.addFormOpen
                }),
            setCurrentEvent: (event: Optional<SelectEvent>) =>
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
            setRules: (eventType: string, rules: SelectRule[]) =>
                set((state) => {
                    state.rules[eventType] = rules;
                }),

        })), {
            name: 'validations',
            storage: createJSONStorage(() => sessionStorage),
        }
    ))
)