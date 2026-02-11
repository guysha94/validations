import {immer} from 'zustand/middleware/immer'
import {createJSONStorage, persist} from 'zustand/middleware'
import {create} from "./storage";
import {Optional, SelectTeam} from "~/domain";


type State = {
    activeTeam: Optional<SelectTeam>;
}

type Actions = {
    setActiveTeam: (team: Optional<SelectTeam>) => void;
}

type Store = State & Actions;

const initialState: State = {
    activeTeam: null,
}

export const useUserInfoStore = create<Store>()(
    persist(immer((set) => ({
            ...initialState,
            setActiveTeam: (team: Optional<SelectTeam>) => set((state) => {
                state.activeTeam = team;
            }),

        })), {
            name: 'user-info',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
)