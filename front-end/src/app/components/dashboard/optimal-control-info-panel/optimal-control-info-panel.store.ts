import { computed, inject, Signal } from '@angular/core';
import { MATH_JS } from '@core/injection-tokens';
import { Model } from '@core/types/model.types';
import {
  InterpolationType,
  InterventionBoundaries,
} from '@core/types/processing';
import { OptimalControlResult } from '@core/types/run.types';
import { datasetToRowData } from '@core/utils';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
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
    interpolationType: string | null;
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
    hamiltonian: string | null;
};

export interface State {
    splitAreasSizes: SplitAreasSizes;
    displayData: DisplayData;
}

const interpolationTypeToString: Record<InterpolationType, string> = {
    [InterpolationType.PiecewiseConstant]: 'Piecewise constant',
    [InterpolationType.PiecewiseLinear]: 'Piecewise linear',
};

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
                interpolationType: null,
                boundaries: [],
            },
        },
        model: null,
        adjointModel: null,
        hamiltonian: null,
    },
};

export const OptimalControlInfoPanelStore = signalStore(
    withState(initialState),
    withProps(() => {
        const mathJs = inject(MATH_JS);

        return {
            _mathJs: mathJs,
        };
    }),
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
                            data &&
                            store._mathJs
                                .parse(data.parameters.objectiveFunction)
                                .toTex(),
                        intervention: {
                            nodesAmount:
                                data &&
                                data.parameters.intervention.nodesAmount,
                            interpolationType:
                                data &&
                                interpolationTypeToString[
                                    data.parameters.intervention
                                        .interpolationType
                                ],
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
                    hamiltonian: data && data.result.hamiltonian,
                    adjointModel: data && data.result.adjointModel,
                },
            });

        return {
            alternateSplitAreasSizes,
            setData,
        };
    }),
);
