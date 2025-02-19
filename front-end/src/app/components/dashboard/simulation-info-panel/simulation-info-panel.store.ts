import { Model } from '@core/types/model.types';
import { SimulationData } from '@core/types/run.types';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

export interface SplitAreasSizes {
    parameters: number;
    model: '*';
}

export type InputData = SimulationData | null;

export type DisplayData = {
    parameters: {
        time: number | null;
        nodesAmount: number | null;
    };
    model: Model | null;
};

export interface State {
    splitAreasSizes: SplitAreasSizes;
    displayData: DisplayData;
}

const initialState: State = {
    splitAreasSizes: {
        parameters: 50,
        model: '*',
    },
    displayData: {
        parameters: {
            time: null,
            nodesAmount: null,
        },
        model: null,
    },
};

export const SimulationInfoPanelStore = signalStore(
    withState(initialState),
    withMethods((store) => {
        let alternator: 1 | -1 = -1;

        const alternateSplitAreasSizes = (): void => {
            const splitAreasSizes: SplitAreasSizes = store.splitAreasSizes();

            patchState(store, {
                splitAreasSizes: {
                    parameters: splitAreasSizes.parameters - 1e-10 * alternator,
                    model: '*',
                },
            });

            alternator *= -1;
        };

        const setData = (data: InputData): void =>
            patchState(store, {
                displayData: {
                    parameters: {
                        time: data && data.parameters.time,
                        nodesAmount: data && data.parameters.nodesAmount,
                    },
                    model: data && data.model,
                },
            });

        return {
            alternateSplitAreasSizes,
            setData,
        };
    }),
);
