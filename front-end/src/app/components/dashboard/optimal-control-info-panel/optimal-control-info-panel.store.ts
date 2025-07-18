import { computed, Signal } from '@angular/core';
import { Model } from '@core/types/model.types';
import {
  ApproximationType,
  InterventionBoundaries,
} from '@core/types/processing';
import { OptimalControlResult } from '@core/types/run.types';
import { datasetToRowData } from '@core/utils';
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

export type InputData = OptimalControlResult | null;

export type InterventionBoundariesDefinition = InterventionBoundaries & {
    name: string;
};

export type DisplayInterventionData = {
    nodesAmount: number | null;
    approximationType: ApproximationType | null;
    boundaries: Record<string, string | number>[];
};

export type DisplayData = {
    result: {
        noControlObjective: number | null;
        optimalObjective: number | null;
        interventions: Record<string, number>[];
    };
    parameters: {
        time: number | null;
        nodesAmount: number | null;
        objectiveFunction: string | null;
        intervention: DisplayInterventionData;
    };
    model: Model | null;
    adjointModel: Record<string, string> | null;
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
            noControlObjective: null,
            optimalObjective: null,
            interventions: [],
        },
        parameters: {
            time: null,
            nodesAmount: null,
            objectiveFunction: null,
            intervention: {
                nodesAmount: null,
                approximationType: null,
                boundaries: [],
            },
        },
        model: null,
        adjointModel: null,
    },
};

export const OptimalControlInfoPanelStore = signalStore(
    withState(initialState),
    withComputed((store) => {
        const interventionsRowScheme: Signal<RowScheme> = computed(
            (): RowScheme => {
                const interventions: Record<string, number>[] =
                    store.displayData().result.interventions;

                return interventions.length
                    ? Object.keys(interventions[0]).reduce(
                          (
                              rowScheme: RowScheme,
                              intervention: string,
                          ): RowScheme => ({
                              ...rowScheme,
                              [intervention]: {
                                  name: intervention,
                                  type: InputType.Number,
                              },
                          }),
                          {},
                      )
                    : {};
            },
        );
        const boundariesRowScheme: Signal<
            RowScheme<InterventionBoundariesDefinition>
        > = computed(
            (): RowScheme<InterventionBoundariesDefinition> => ({
                name: {
                    name: 'Name',
                    type: InputType.Text,
                },
                lowerBoundary: {
                    name: 'Lower boundary',
                    type: InputType.Number,
                },
                upperBoundary: {
                    name: 'Upper boundary',
                    type: InputType.Number,
                },
            }),
        );

        return {
            interventionsRowScheme,
            boundariesRowScheme,
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
                        noControlObjective:
                            data && data.result.noControlObjective,
                        optimalObjective: data && data.result.optimalObjective,
                        interventions: data
                            ? datasetToRowData(data.result.interventions)
                            : [],
                    },
                    parameters: {
                        time: data && data.parameters.time,
                        nodesAmount: data && data.parameters.nodesAmount,
                        objectiveFunction:
                            data && data.parameters.objectiveFunction,
                        intervention: {
                            nodesAmount:
                                data &&
                                data.parameters.intervention.nodesAmount,
                            approximationType:
                                data &&
                                data.parameters.intervention.approximationType,
                            boundaries: data
                                ? Object.entries(
                                      data.parameters.intervention.boundaries,
                                  ).map(
                                      ([name, boundaries]: [
                                          string,
                                          InterventionBoundaries,
                                      ]): Record<string, string | number> => ({
                                          name,
                                          ...boundaries,
                                      }),
                                  )
                                : [],
                        },
                    },
                    model: data && data.model,
                    adjointModel: data && data.result.adjointModel,
                },
            });

        return {
            alternateSplitAreasSizes,
            setData,
        };
    }),
);
