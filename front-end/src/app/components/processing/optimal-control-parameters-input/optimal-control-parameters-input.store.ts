import { computed, Signal } from '@angular/core';
import { ApproximationType } from '@core/types/processing';
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
    objectiveFunction: string | null;
    intervention: {
        nodesAmount: number | null;
        approximationType: ApproximationType | null;
        lowerBoundary: number | null;
        upperBoundary: number | null;
    } | null;
}

export type FormValue = Value;

const initialState: FormValue = {
    time: null,
    nodesAmount: null,
    objectiveFunction: null,
    intervention: {
        nodesAmount: null,
        approximationType: null,
        lowerBoundary: null,
        upperBoundary: null,
    },
};

export const OptimalControlParametersInputStore = signalStore(
    withState(initialState),
    withComputed((store) => {
        const value: Signal<Value> = computed((): Value => formValue(), {
            equal: areEqual,
        });
        const formValue: Signal<FormValue> = computed(
            (): FormValue => ({
                time: store.time(),
                nodesAmount: store.nodesAmount(),
                objectiveFunction: store.objectiveFunction(),
                intervention: store.intervention(),
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
                objectiveFunction: value && value.objectiveFunction,
                intervention: value?.intervention ?? {
                    nodesAmount: null,
                    approximationType: null,
                    lowerBoundary: null,
                    upperBoundary: null,
                },
            });
        const setValueFromForm = (value: FormValue): void =>
            patchState(store, value);

        return {
            setValueFromParent,
            setValueFromForm,
        };
    }),
);
