import { computed, Signal } from '@angular/core';
import { Validators } from '@angular/forms';

import {
  Compartment,
  Constant,
  Flow,
  Intervention,
} from '@core/types/model.types';
import { areEqual } from '@core/utils';
import { definitionName } from '@core/validators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  InputType,
  Option,
  RowScheme,
} from 'src/app/components/shared/datatable/datatable.store';
import { v4 as uuid } from 'uuid';

export type CompartmentDefinition = Omit<Compartment, 'id'>;
export type ConstantDefinition = Omit<Constant, 'id'>;
export type InterventionDefinition = Omit<Intervention, 'id'>;
export type FlowDefinition = Omit<Flow, 'id' | 'equation'>;

export interface Value {
    compartments: Compartment[];
    constants: Constant[];
    interventions: Intervention[];
    flows: Flow[];
}

export interface FormValue {
    compartments: (Compartment | CompartmentDefinition)[];
    constants: (Constant | ConstantDefinition)[];
    interventions: (Intervention | InterventionDefinition)[];
    flows: (Flow | FlowDefinition)[];
}

const initialValue: FormValue = {
    compartments: [],
    constants: [],
    interventions: [],
    flows: [],
};

export const DefinitionsTableStore = signalStore(
    withState(initialValue),
    withComputed((store) => {
        const value: Signal<Value> = computed(
            (): Value => {
                const rawValue: FormValue = formValue();

                const compartments: Compartment[] = rawValue.compartments.map(
                    (
                        compartment: Compartment | CompartmentDefinition,
                    ): Compartment => {
                        if ('id' in compartment) {
                            return compartment;
                        }

                        return {
                            ...compartment,
                            id: uuid(),
                        };
                    },
                );
                const constants: Constant[] = rawValue.constants.map(
                    (constant: Constant | ConstantDefinition): Constant => {
                        if ('id' in constant) {
                            return constant;
                        }

                        return {
                            ...constant,
                            id: uuid(),
                        };
                    },
                );
                const interventions: Intervention[] =
                    rawValue.interventions.map(
                        (
                            intervention: Intervention | InterventionDefinition,
                        ): Intervention => {
                            if ('id' in intervention) {
                                return intervention;
                            }

                            return {
                                ...intervention,
                                id: uuid(),
                            };
                        },
                    );
                const flows: Flow[] = rawValue.flows.map(
                    (flow: Flow | FlowDefinition): Flow => {
                        if ('id' in flow) {
                            return flow;
                        }

                        return {
                            ...flow,
                            id: uuid(),
                            equation: '',
                        };
                    },
                );

                return {
                    compartments,
                    constants,
                    interventions,
                    flows,
                };
            },
            {
                equal: areEqual,
            },
        );
        const formValue: Signal<FormValue> = computed(
            (): FormValue => ({
                compartments: store.compartments(),
                constants: store.constants(),
                interventions: store.interventions(),
                flows: store.flows(),
            }),
            {
                equal: areEqual,
            },
        );

        const symbols: Signal<string[]> = computed((): string[] => {
            const compartments: string[] = store
                .compartments()
                .map(
                    (
                        compartment: Compartment | CompartmentDefinition,
                    ): string => compartment.name,
                );
            const constants: string[] = store
                .constants()
                .map(
                    (constant: Constant | ConstantDefinition): string =>
                        constant.name,
                );
            const interventions: string[] = store
                .interventions()
                .map(
                    (
                        intervention: Intervention | InterventionDefinition,
                    ): string => intervention.name,
                );

            return [...compartments, ...constants, ...interventions];
        });

        const compartmentsRowScheme: Signal<RowScheme<CompartmentDefinition>> =
            computed(
                (): RowScheme<CompartmentDefinition> => ({
                    name: {
                        name: 'Name',
                        type: InputType.Text,
                        editable: true,
                        validationFns: [
                            Validators.required,
                            definitionName(symbols),
                        ],
                    },
                    value: {
                        name: 'Value',
                        type: InputType.Number,
                        editable: true,
                        validationFns: [Validators.required, Validators.min(0)],
                    },
                }),
            );

        const constantsRowScheme: Signal<RowScheme<ConstantDefinition>> =
            computed(
                (): RowScheme<ConstantDefinition> => ({
                    name: {
                        name: 'Name',
                        type: InputType.Text,
                        editable: true,
                        validationFns: [
                            Validators.required,
                            definitionName(symbols),
                        ],
                    },
                    value: {
                        name: 'Value',
                        type: InputType.Number,
                        editable: true,
                        validationFns: [Validators.required],
                    },
                }),
            );

        const interventionsRowScheme: Signal<
            RowScheme<InterventionDefinition>
        > = computed(
            (): RowScheme<InterventionDefinition> => ({
                name: {
                    name: 'Name',
                    type: InputType.Text,
                    editable: true,
                    validationFns: [
                        Validators.required,
                        definitionName(symbols),
                    ],
                },
            }),
        );

        const flowsRowScheme: Signal<RowScheme<FlowDefinition>> = computed(
            (): RowScheme<FlowDefinition> => {
                const options: Option[] = value().compartments.map(
                    (compartment: Compartment): Option => ({
                        value: compartment.id,
                        label: compartment.name,
                    }),
                );

                return {
                    source: {
                        name: 'Source',
                        type: InputType.Select,
                        exclusive: false,
                        options,
                        editable: true,
                        validationFns: [Validators.required],
                    },
                    target: {
                        name: 'Target',
                        type: InputType.Select,
                        exclusive: false,
                        options,
                        editable: true,
                        validationFns: [Validators.required],
                    },
                };
            },
        );

        return {
            value,
            formValue,

            symbols,

            compartmentsRowScheme,
            constantsRowScheme,
            interventionsRowScheme,
            flowsRowScheme,
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
    }),
);
