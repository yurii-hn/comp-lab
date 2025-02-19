import { computed, Signal } from '@angular/core';
import { Model } from '@core/types/model.types';
import { IdentifiedConstant, SelectedConstant } from '@core/types/processing';
import { PIData } from '@core/types/run.types';
import { getSetArray, valuesToRowData } from '@core/utils';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  InputType,
  RowScheme,
} from 'src/app/components/shared/datatable/datatable.store';

export interface SplitAreasSizes {
    results: number;
    parameters: number;
    model: '*';
}

export type InputData = PIData | null;

export type DisplayData = {
    result: {
        constants: Record<string, string | number>[];
    };
    parameters: {
        nodesAmount: number | null;
        forecastTime: number;
        selectedConstants: Record<string, string | number>[];
        data: Record<string, number>[];
    };
    model: Model | null;
};

export interface State {
    splitAreasSizes: SplitAreasSizes;
    displayData: DisplayData;
}

const initialState: State = {
    splitAreasSizes: {
        results: 33,
        parameters: 33,
        model: '*',
    },
    displayData: {
        result: {
            constants: [],
        },
        parameters: {
            nodesAmount: null,
            forecastTime: 0,
            selectedConstants: [],
            data: [],
        },
        model: null,
    },
};

export const PIInfoPanelStore = signalStore(
    withState(initialState),
    withComputed((store) => {
        const selectedConstantsRowScheme: Signal<RowScheme<SelectedConstant>> =
            computed(
                (): RowScheme<SelectedConstant> => ({
                    name: {
                        name: 'Name',
                        type: InputType.Text,
                    },
                    lowerBoundary: {
                        name: 'Lower boundary',
                        type: InputType.Number,
                    },
                    value: {
                        name: 'Initial guess',
                        type: InputType.Number,
                    },
                    upperBoundary: {
                        name: 'Upper boundary',
                        type: InputType.Number,
                    },
                }),
            );
        const dataRowScheme: Signal<RowScheme> = computed((): RowScheme => {
            const data: Record<string, number>[] =
                store.displayData().parameters.data;

            if (!data.length) {
                return {};
            }

            const columns: string[] = getSetArray(
                data
                    .map((row: Record<string, number>): string[] =>
                        Object.keys(row),
                    )
                    .flat(),
            );

            return columns.reduce(
                (rowScheme: RowScheme, value: string): RowScheme => ({
                    ...rowScheme,
                    [value]: {
                        name: value,
                        type: InputType.Number,
                    },
                }),
                {},
            );
        });
        const identifiedConstantsRowScheme: Signal<
            RowScheme<IdentifiedConstant>
        > = computed(
            (): RowScheme<IdentifiedConstant> => ({
                name: {
                    name: 'Name',
                    type: InputType.Text,
                },
                value: {
                    name: 'Value',
                    type: InputType.Number,
                },
            }),
        );

        return {
            selectedConstantsRowScheme,
            dataRowScheme,
            identifiedConstantsRowScheme,
        };
    }),
    withMethods((store) => {
        let alternator: 1 | -1 = -1;

        const alternateSplitAreasSizes = (): void => {
            const splitAreasSizes: SplitAreasSizes = store.splitAreasSizes();

            patchState(store, {
                splitAreasSizes: {
                    results: splitAreasSizes.results + 1e-10 * alternator,
                    parameters: splitAreasSizes.parameters - 1e-10 * alternator,
                    model: '*',
                },
            });

            alternator *= -1;
        };

        const setData = (data: InputData): void =>
            patchState(store, {
                displayData: {
                    result: {
                        constants: data
                            ? (data.result.constants as unknown as Record<
                                  string,
                                  string | number
                              >[])
                            : [],
                    },
                    parameters: {
                        nodesAmount: data && data.parameters.nodesAmount,
                        forecastTime: data ? data.parameters.forecastTime : 0,
                        selectedConstants: data
                            ? (data.parameters
                                  .selectedConstants as unknown as Record<
                                  string,
                                  string | number
                              >[])
                            : [],
                        data: data ? valuesToRowData(data.parameters.data) : [],
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
