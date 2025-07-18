import { computed, inject, Signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { Intervention } from '@core/types/model.types';
import {
  InterpolationType,
  InterventionBoundaries,
} from '@core/types/processing';
import { areEqual } from '@core/utils';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { Store } from '@ngrx/store';
import {
  InputType,
  Option,
  RowScheme,
} from 'src/app/components/shared/datatable/datatable.store';
import { selectInterventions } from 'src/app/state/selectors/workspace.selectors';

export type InterventionBoundariesDefinition = InterventionBoundaries & {
    name: string;
};

export interface Value {
    time: number | null;
    nodesAmount: number | null;
    objectiveFunction: string | null;
    intervention: {
        nodesAmount: number | null;
        interpolationType: InterpolationType | null;
        boundaries: Record<string, InterventionBoundaries> | null;
    } | null;
}

export interface FormValue {
    time: number | null;
    nodesAmount: number | null;
    objectiveFunction: string | null;
    intervention: {
        nodesAmount: number | null;
        interpolationType: InterpolationType | null;
        boundaries: InterventionBoundariesDefinition[] | null;
    } | null;
}

const initialState: FormValue = {
    time: null,
    nodesAmount: null,
    objectiveFunction: null,
    intervention: {
        nodesAmount: null,
        interpolationType: null,
        boundaries: null,
    },
};

export const OptimalControlParametersInputStore = signalStore(
    withState(initialState),
    withProps(() => {
        const globalStore: Store = inject(Store);

        const interventions: Signal<Intervention[]> =
            globalStore.selectSignal(selectInterventions);

        return {
            _interventions: interventions,
        };
    }),
    withComputed((store) => {
        const value: Signal<Value> = computed(
            (): Value => {
                const parameters: FormValue = formValue();

                const time: number | null = parameters.time;
                const nodesAmount: number | null = parameters.nodesAmount;
                const objectiveFunction: string | null =
                    parameters.objectiveFunction;
                const intervention: Value['intervention'] | null =
                    parameters.intervention && {
                        ...parameters.intervention,
                        boundaries:
                            parameters.intervention.boundaries &&
                            parameters.intervention.boundaries.reduce(
                                (
                                    boundaries: Record<
                                        string,
                                        InterventionBoundaries
                                    >,
                                    boundary: InterventionBoundariesDefinition
                                ): Record<string, InterventionBoundaries> => ({
                                    ...boundaries,
                                    [boundary.name]: {
                                        lowerBoundary: boundary.lowerBoundary,
                                        upperBoundary: boundary.upperBoundary,
                                    },
                                }),
                                {}
                            ),
                    };

                return {
                    time,
                    nodesAmount,
                    objectiveFunction,
                    intervention,
                };
            },
            {
                equal: areEqual,
            }
        );
        const formValue: Signal<FormValue> = computed(
            (): FormValue => ({
                time: store.time(),
                nodesAmount: store.nodesAmount(),
                objectiveFunction: store.objectiveFunction(),
                intervention: store.intervention(),
            }),
            {
                equal: areEqual,
            }
        );

        const boundariesRowScheme: Signal<
            RowScheme<InterventionBoundariesDefinition>
        > = computed(
            (): RowScheme<InterventionBoundariesDefinition> => ({
                name: {
                    name: 'Name',
                    type: InputType.Select,
                    exclusive: true,
                    options: store._interventions().map(
                        (constant: Intervention): Option => ({
                            value: constant.name,
                            label: constant.name,
                        })
                    ),
                    validationFns: [Validators.required],
                },
                lowerBoundary: {
                    name: 'Lower boundary',
                    type: InputType.Number,
                    validationFns: [Validators.required],
                    editable: true,
                },
                upperBoundary: {
                    name: 'Upper boundary',
                    type: InputType.Number,
                    validationFns: [Validators.required],
                    editable: true,
                },
            })
        );

        const interventionsNames: Signal<string[]> = computed((): string[] =>
            store
                ._interventions()
                .map((intervention: Intervention): string => intervention.name)
        );

        return {
            value,
            formValue,

            boundariesRowScheme,
            interventionsNames,
        };
    }),
    withMethods((store) => {
        const setValueFromParent = (value: Value | null): void =>
            patchState(store, {
                time: value && value.time,
                nodesAmount: value && value.nodesAmount,
                objectiveFunction: value && value.objectiveFunction,
                intervention: value?.intervention && {
                    ...value.intervention,
                    boundaries:
                        value.intervention.boundaries &&
                        Object.entries(value.intervention.boundaries).map(
                            ([name, boundaries]: [
                                string,
                                InterventionBoundaries
                            ]): InterventionBoundariesDefinition => ({
                                name,
                                ...boundaries,
                            })
                        ),
                },
            });
        const setValueFromForm = (value: FormValue): void =>
            patchState(store, value);

        return {
            setValueFromParent,
            setValueFromForm,
        };
    })
);
