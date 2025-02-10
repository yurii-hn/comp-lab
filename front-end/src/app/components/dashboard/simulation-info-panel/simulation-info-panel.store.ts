import { computed, Signal } from '@angular/core';
import { SimulationData } from '@core/types/run.types';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

export type InputData = SimulationData | null;

export type DisplayData = {
    parameters: {
        time: number | null;
        nodesAmount: number | null;
    };
};

const initialState: DisplayData = {
    parameters: {
        time: null,
        nodesAmount: null,
    },
};

export const SimulationInfoPanelStore = signalStore(
    withState(initialState),
    withComputed((store) => {
        const displayData: Signal<DisplayData> = computed(
            (): DisplayData => ({
                parameters: store.parameters(),
            }),
        );

        return {
            displayData,
        };
    }),
    withMethods((store) => {
        const setData = (data: InputData): void =>
            patchState(store, {
                parameters: {
                    time: data && data.parameters.time,
                    nodesAmount: data && data.parameters.nodesAmount,
                },
            });

        return {
            setData,
        };
    }),
);
