import { computed, Signal } from '@angular/core';
import { ProcessingType } from '@core/types/processing';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

export type Value = ProcessingType;

export type FormValue = number;

export interface State {
    _value: FormValue;
}

const initialState: State = {
    _value: 0,
};

export const ProcessingDialogStore = signalStore(
    withState(initialState),
    withComputed((store) => {
        const value: Signal<Value> = computed((): Value => {
            switch (store._value()) {
                case 0:
                    return ProcessingType.Simulation;

                case 1:
                    return ProcessingType.OptimalControl;

                case 2:
                    return ProcessingType.PI;

                default:
                    throw new Error('Unknown processing mode');
            }
        });
        const formValue: Signal<FormValue> = computed(
            (): FormValue => store._value(),
        );

        return {
            value,
            formValue,
        };
    }),
    withMethods((store) => {
        const setValueFromForm = (value: FormValue): void => {
            patchState(store, { _value: value });
        };

        return {
            setValueFromForm,
        };
    }),
);
