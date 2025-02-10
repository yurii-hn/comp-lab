import { computed, Signal } from '@angular/core';
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

export type InputData = PIData | null;

export type DisplayData = {
    parameters: {
        nodesAmount: number | null;
        selectedConstants: Record<string, string | number>[];
        data: Record<string, number>[];
    };
    result: {
        constants: Record<string, string | number>[];
    };
};

const initialState: DisplayData = {
    parameters: {
        nodesAmount: null,
        selectedConstants: [],
        data: [],
    },
    result: {
        constants: [],
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
            const data: Record<string, number>[] = store.parameters().data;

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

        const displayData = computed(
            (): DisplayData => ({
                parameters: store.parameters(),
                result: store.result(),
            }),
        );

        return {
            displayData,
            selectedConstantsRowScheme,
            dataRowScheme,
            identifiedConstantsRowScheme,
        };
    }),
    withMethods((store) => {
        const setData = (inputData: InputData): void =>
            patchState(store, {
                parameters: {
                    nodesAmount: inputData && inputData.parameters.nodesAmount,
                    selectedConstants: inputData
                        ? (inputData.parameters
                              .selectedConstants as unknown as Record<
                              string,
                              string | number
                          >[])
                        : [],
                    data: inputData
                        ? valuesToRowData(inputData.parameters.data)
                        : [],
                },
                result: {
                    constants: inputData
                        ? (inputData.result.constants as unknown as Record<
                              string,
                              string | number
                          >[])
                        : [],
                },
            });

        return {
            setData,
        };
    }),
);
