import { computed, Signal } from '@angular/core';
import { areEqual } from '@core/utils';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  Palette,
  PlotYAxisRangeMode,
  SettingsState,
  Theme,
} from 'src/app/state/reducers/settings.reducer';

export type Value = SettingsState;

export type FormValue = Value;

const initialState: FormValue = {
    app: {
        theme: Theme.System,
        palette: Palette.Cyan,
    },
    dashboard: {
        yAxisRangeMode: PlotYAxisRangeMode.Normal,
    },
};

export const SettingsStore = signalStore(
    withState(initialState),
    withComputed((store) => {
        const value: Signal<Value> = computed(() => formValue(), {
            equal: areEqual,
        });
        const formValue: Signal<FormValue> = computed(
            () => ({
                app: store.app(),
                dashboard: store.dashboard(),
            }),
            {
                equal: areEqual,
            }
        );

        return {
            value,
            formValue,
        };
    }),
    withMethods((store) => {
        const setValueFromParent = (value: Value): void =>
            patchState(store, value);
        const setValueFromForm = (value: FormValue): void =>
            patchState(store, value);

        return {
            setValueFromParent,
            setValueFromForm,
        };
    })
);
