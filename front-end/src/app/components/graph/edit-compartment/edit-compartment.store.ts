import { computed, inject, Signal } from '@angular/core';
import { Compartment } from '@core/types/model.types';
import { areEqual } from '@core/utils';
import {
 patchState,
 signalStore,
 withComputed,
 withMethods,
 withProps,
 withState,
} from '@ngrx/signals';
import { Store } from '@ngrx/store';
import { selectSymbols } from 'src/app/state/selectors/workspace.selectors';
import { v4 as uuid } from 'uuid';

export type Value = Compartment;

export interface FormValue {
    name: string;
    value: number;
}

export interface State {
    _initialData: Compartment | null;
    _value: FormValue;
}

const initialState: State = {
    _initialData: null,
    _value: {
        name: '',
        value: 0,
    },
};

export const EditCompartmentStore = signalStore(
    withState(initialState),
    withProps(() => {
        const globalStore: Store = inject(Store);

        const symbols: Signal<string[]> =
            globalStore.selectSignal(selectSymbols);

        return {
            symbols,
        };
    }),
    withComputed((store) => {
        const value: Signal<Value> = computed(
            (): Value => ({
                ...store._value(),
                id: store._initialData()?.id ?? uuid(),
            }),
            {
                equal: areEqual,
            }
        );
        const formValue: Signal<FormValue> = computed(
            (): FormValue => store._value(),
            {
                equal: areEqual,
            }
        );

        const editMode: Signal<boolean> = computed(
            (): boolean => !!store._initialData()
        );

        return {
            value,
            formValue,

            editMode,
        };
    }),
    withMethods((store) => {
        const setInitialData = (initialData: Compartment | null): void =>
            patchState(store, {
                _initialData: initialData,
                _value: initialData
                    ? { ...store._value(), ...initialData }
                    : store._value(),
            });
        const setValueFromForm = (value: FormValue): void => {
            patchState(store, { _value: value });
        };

        return {
            setInitialData,
            setValueFromForm,
        };
    })
);
