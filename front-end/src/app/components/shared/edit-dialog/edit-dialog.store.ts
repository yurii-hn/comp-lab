import { computed, Signal } from '@angular/core';
import { ValidatorFn } from '@angular/forms';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

export enum EditInputType {
    String = 'string',
    Number = 'number',
}

export type EditDialogData = Partial<State>;

export type Value = string | number;

export type FormValue = Value;

export interface State {
    title: string;
    message: string;
    type: EditInputType;
    confirmText: string;
    cancelText: string;
    value: FormValue;
    validationFns: ValidatorFn[];
}

const initialState: State = {
    title: 'Edit',
    message: 'Enter new value',
    confirmText: 'Save',
    cancelText: 'Cancel',
    type: EditInputType.String,
    value: '',
    validationFns: [],
};

export const EditDialogStore = signalStore(
    withState(initialState),
    withComputed((store) => {
        const value: Signal<Value> = computed((): Value => formValue());
        const formValue: Signal<FormValue> = computed(
            (): FormValue => store.value(),
        );

        return {
            value,
            formValue,
        };
    }),
    withMethods((store) => {
        const setData = (data: EditDialogData): void => patchState(store, data);

        const setValueFromParent = (value: Value): void =>
            patchState(store, {
                value,
            });
        const setValueFromForm = (value: FormValue): void => {
            patchState(store, {
                value,
            });
        };

        return {
            setData,
            setValueFromParent,
            setValueFromForm,
        };
    }),
);
