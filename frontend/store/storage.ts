import type {StateCreator} from "zustand";
import {create as actualCreate} from "zustand";
import type {StoreApi, StoreMutatorIdentifier} from "zustand/vanilla";
import type {UseBoundStore} from "zustand/react";
import {PersistOptions} from "zustand/middleware/persist";

const storeResetFns = new Set<() => void>();

export function resetAllStores() {
    storeResetFns.forEach((resetFn) => resetFn());
}


type PersistListener<S> = (state: S) => void;
type StorePersist<S, Ps, Pr> = S extends {
    getState: () => infer T;
    setState: {
        (...args: infer Sa1): infer Sr1;
        (...args: infer Sa2): infer Sr2;
    };
} ? {
    setState(...args: Sa1): Sr1 | Pr;
    setState(...args: Sa2): Sr2 | Pr;
    persist: {
        setOptions: (options: Partial<PersistOptions<T, Ps, Pr>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: PersistListener<T>) => () => void;
        onFinishHydration: (fn: PersistListener<T>) => () => void;
        getOptions: () => Partial<PersistOptions<T, Ps, Pr>>;
    };
} : never;
type Write<T, U> = Omit<T, keyof U> & U;
export type WithPersist<S, A> = Write<S, StorePersist<S, A, unknown>>;

type StoreWithOptionalPersist = {
    getState: () => unknown;
    setState: (state: unknown, replace?: boolean) => void;
    persist?: { clearStorage?: () => void };
};

/**
 * Wraps zustand's create. Registers a reset function for each store:
 * - If the store has persist middleware: calls persist.clearStorage() then resets in-memory state to initial.
 * - Otherwise: resets in-memory state to initial only.
 * Accepts middleware-wrapped creators (e.g. persist(immer(...))).
 */
export const create = <T, >() => {
    return <
        Mps extends [StoreMutatorIdentifier, unknown][] = [],
        Mcs extends [StoreMutatorIdentifier, unknown][] = [],
    >(
        stateCreator: StateCreator<T, Mps, Mcs>,
    ): UseBoundStore<WithPersist<StoreApi<T>, unknown>> => {
        const store = actualCreate(
            stateCreator as StateCreator<T>,
        ) as StoreWithOptionalPersist;
        const initialState = store.getState();

        storeResetFns.add(() => {
            if (store.persist?.clearStorage) {
                store.persist.clearStorage();
            }
            store.setState(initialState as T, true);
        });

        return store as UseBoundStore<WithPersist<StoreApi<T>, unknown>>;
    };
};

