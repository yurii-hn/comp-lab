import { computed, Signal } from '@angular/core';
import { Model } from '@core/types/model.types';
import { SelectedConstant } from '@core/types/processing';
import { PIResult } from '@core/types/run.types';
import { datasetToRowData, getSetArray } from '@core/utils';
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

export type InputData = PIResult | null;

export type SelectedConstantDefinition = SelectedConstant & {
    name: string;
};

export type IdentifiedConstantDefinition = {
    name: string;
    value: string;
};

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
                (): RowScheme<SelectedConstantDefinition> => ({
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
                })
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
                        Object.keys(row)
                    )
                    .flat()
            );

            return columns.reduce(
                (rowScheme: RowScheme, value: string): RowScheme => ({
                    ...rowScheme,
                    [value]: {
                        name: value,
                        type: InputType.Number,
                    },
                }),
                {}
            );
        });
        const identifiedConstantsRowScheme: Signal<
            RowScheme<IdentifiedConstantDefinition>
        > = computed(
            (): RowScheme<IdentifiedConstantDefinition> => ({
                name: {
                    name: 'Name',
                    type: InputType.Text,
                },
                value: {
                    name: 'Value',
                    type: InputType.Number,
                },
            })
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
                            ? Object.entries(data.result.constants).map(
                                  ([name, value]: [string, number]): Record<
                                      string,
                                      string | number
                                  > => ({
                                      name,
                                      value,
                                  })
                              )
                            : [],
                    },
                    parameters: {
                        nodesAmount: data && data.parameters.nodesAmount,
                        forecastTime: data ? data.parameters.forecastTime : 0,
                        selectedConstants: data
                            ? Object.entries(
                                  data.parameters.selectedConstants
                              ).map(
                                  ([name, constant]: [
                                      string,
                                      SelectedConstant
                                  ]): Record<string, string | number> => ({
                                      name,
                                      ...constant,
                                  })
                              )
                            : [],
                        data: data
                            ? datasetToRowData(data.parameters.data)
                            : [],
                    },
                    model: data && data.model,
                },
            });

        return {
            alternateSplitAreasSizes,
            setData,
        };
    })
);
