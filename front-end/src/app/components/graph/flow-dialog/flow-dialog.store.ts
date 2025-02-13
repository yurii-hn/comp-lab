import { computed, inject, Signal } from '@angular/core';
import { Compartment, Flow } from '@core/types/model.types';
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
import { Option } from 'src/app/components/shared/datatable/datatable.store';
import { selectCompartments } from 'src/app/state/selectors/workspace.selectors';
import { v4 as uuid } from 'uuid';

export type EmptyFlow = Omit<Flow, 'id' | 'equation'>;

export type Value = Flow;

export interface FormValue {
    source: string;
    target: string;
    equation: string;
}

export interface State {
    _initialData: Flow | EmptyFlow;
    _value: FormValue;
}

const initialState: State = {
    _initialData: {
        source: '',
        target: '',
    },
    _value: {
        source: '',
        target: '',
        equation: '',
    },
};

export const FlowDialogStore = signalStore(
    withState(initialState),
    withProps(() => {
        const globalStore: Store = inject(Store);

        const compartments: Signal<Compartment[]> =
            globalStore.selectSignal(selectCompartments);

        return {
            _compartments: compartments,
        };
    }),
    withComputed((store) => {
        const value: Signal<Value> = computed(
            (): Value => {
                const initialData: Flow | EmptyFlow = store._initialData();
                const formValue: FormValue = store._value();

                return {
                    ...formValue,
                    id: 'id' in initialData ? initialData.id : uuid(),
                };
            },
            {
                equal: areEqual,
            },
        );
        const formValue: Signal<FormValue> = computed(
            (): FormValue => store._value(),
            {
                equal: areEqual,
            },
        );

        const editMode: Signal<boolean> = computed(
            (): boolean => 'id' in store._initialData(),
        );

        const sources: Signal<Option[]> = computed((): Option[] =>
            store
                ._compartments()
                .filter(
                    (compartment: Compartment): boolean =>
                        compartment.id !== store._value.target(),
                )
                .map(
                    (compartment: Compartment): Option => ({
                        value: compartment.id,
                        label: compartment.name,
                    }),
                ),
        );

        const targets: Signal<Option[]> = computed((): Option[] =>
            store
                ._compartments()
                .filter(
                    (compartment: Compartment): boolean =>
                        compartment.id !== store._value.source(),
                )
                .map(
                    (compartment: Compartment): Option => ({
                        value: compartment.id,
                        label: compartment.name,
                    }),
                ),
        );

        return {
            value,
            formValue,

            editMode,
            sources,
            targets,
        };
    }),
    withMethods((store) => {
        const setInitialData = (initialData: Flow | EmptyFlow): void =>
            patchState(store, {
                _initialData: initialData,
                _value: { ...store._value(), ...initialData },
            });
        const setValueFromForm = (value: FormValue): void => {
            patchState(store, { _value: value });
        };

        return {
            setInitialData,
            setValueFromForm,
        };
    }),
);
