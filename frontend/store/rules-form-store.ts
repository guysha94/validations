import {immer} from 'zustand/middleware/immer'
import {createJSONStorage, persist} from 'zustand/middleware'
import {create} from "./storage";
import {SelectRule} from "~/domain";
import {compute, computed} from "zustand-computed-state";
import {useValidationsStore} from "~/store/validations-store";


type State = {
    forms: Record<string, Record<string, SelectRule>>
    activeFormRules: Record<string, SelectRule> | undefined | null;
}

type Actions = {
    setForm: (eventId: string, rules: SelectRule[]) => void;
    addRule: (eventId: string, rule: SelectRule) => void;
    removeRule: (eventId: string, ruleId: string) => void;
    clearForm: (eventId: string) => void;
}

type Store = State & Actions;

const initialState: State = {
    forms: {},
    activeFormRules: undefined,
}

export const useFormStore = create<Store>()(
    persist(computed(immer((set) => compute<Store>(({
            ...initialState,
            setForm: (eventId: string, rules: SelectRule[]) => set((state) => {
                state.forms[eventId] = rules.reduce((acc, r) => {
                    acc[r.id] = { ...r };
                    return acc;
                }, {} as Record<string, SelectRule>);
            }),
            addRule: (eventId: string, rule: SelectRule) => set((state) => {
                if (!state.forms[eventId]) {
                    state.forms[eventId] = {};
                }
                state.forms[eventId][rule.id] = { ...rule };
            }),
            removeRule: (eventId: string, ruleId: string) => set((state) => {
                if (state.forms[eventId]) {
                    delete state.forms[eventId][ruleId];
                }
            }),
            clearForm: (eventId: string) => set((state) => {
                delete state.forms[eventId];
            }),

            get activeFormRules() {
                const eventId = useValidationsStore.getState().currentEvent?.id;
                if (!eventId) return undefined;
                return this.forms?.[eventId];
            }

        })))), {
            name: 'rules-form',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
)