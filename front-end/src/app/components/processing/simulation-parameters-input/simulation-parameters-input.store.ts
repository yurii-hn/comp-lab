import { computed, Signal } from '@angular/core';
import { areEqual } from '@core/utils';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

export interface Value {
    time: number | null;
    nodesAmount: number | null;
}

export type FormValue = Value;

const initialState: FormValue = {
    time: null,
    nodesAmount: null,
};

export const SimulationParametersInputStore = signalStore(
    withState(initialState),
    withComputed((store) => {
        const value: Signal<Value> = computed((): Value => formValue(), {
            equal: areEqual,
        });
        const formValue: Signal<FormValue> = computed(
            (): FormValue => ({
                time: store.time(),
                nodesAmount: store.nodesAmount(),
            }),
            {
                equal: areEqual,
            },
        );

        return {
            value,
            formValue,
        };
    }),
    withMethods((store) => {
        const setValueFromParent = (value: Value | null): void =>
            patchState(store, {
                time: value && value.time,
                nodesAmount: value && value.nodesAmount,
            });
        const setValueFromForm = (value: FormValue): void => {
            patchState(store, value);
        };

        return {
            setValueFromParent,
            setValueFromForm,
        };
    }),
);
