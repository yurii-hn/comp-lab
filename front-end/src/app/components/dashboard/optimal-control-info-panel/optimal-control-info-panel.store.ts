import { computed, Signal } from '@angular/core';
import { ApproximationType } from '@core/types/processing';
import { OptimalControlData } from '@core/types/run.types';
import { valuesToRowData } from '@core/utils';
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

export type InputData = OptimalControlData | null;

export type DisplayInterventionData = {
    nodesAmount: number | null;
    approximationType: ApproximationType | null;
    lowerBoundary: number | null;
    upperBoundary: number | null;
};

export type DisplayData = {
    parameters: {
        time: number | null;
        nodesAmount: number | null;
        objectiveFunction: string | null;
        intervention: DisplayInterventionData;
    };
    result: {
        noControlObjective: number | null;
        optimalObjective: number | null;
        interventions: Record<string, number>[];
    };
};

const initialState: DisplayData = {
    parameters: {
        time: null,
        nodesAmount: null,
        objectiveFunction: null,
        intervention: {
            nodesAmount: null,
            approximationType: null,
            lowerBoundary: null,
            upperBoundary: null,
        },
    },
    result: {
        noControlObjective: null,
        optimalObjective: null,
        interventions: [],
    },
};

export const OptimalControlInfoPanelStore = signalStore(
    withState(initialState),
    withComputed((store) => {
        const interventionsRowScheme: Signal<RowScheme> = computed(
            (): RowScheme => {
                const interventions: Record<string, number>[] =
                    store.result().interventions;

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

        const displayData: Signal<DisplayData> = computed(
            (): DisplayData => ({
                parameters: store.parameters(),
                result: store.result(),
            }),
        );

        return {
            displayData,
            interventionsRowScheme,
        };
    }),
    withMethods((store) => {
        const setData = (data: InputData): void =>
            patchState(store, {
                parameters: {
                    time: data && data.parameters.time,
                    nodesAmount: data && data.parameters.nodesAmount,
                    objectiveFunction:
                        data && data.parameters.objectiveFunction,
                    intervention: {
                        nodesAmount:
                            data && data.parameters.intervention.nodesAmount,
                        approximationType:
                            data &&
                            data.parameters.intervention.approximationType,
                        lowerBoundary:
                            data && data.parameters.intervention.lowerBoundary,
                        upperBoundary:
                            data && data.parameters.intervention.upperBoundary,
                    },
                },
                result: {
                    noControlObjective:
                        data && data.result[1].noControlObjective,
                    optimalObjective: data && data.result[1].optimalObjective,
                    interventions: data
                        ? valuesToRowData(data.result[1].interventions)
                        : [],
                },
            });

        return {
            setData,
        };
    }),
);
