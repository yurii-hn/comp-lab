import { computed, inject, Signal } from '@angular/core';
import { MATH_JS } from '@core/injection-tokens';
import {
  Compartment,
  Constant,
  Flow,
  Intervention,
  Model,
} from '@core/types/model.types';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';

export interface ExpressionsGroup {
    name: string;
    expressions: string[];
}

export interface State {
    _model: Model | null;
    _adjointModel: Record<string, string> | null;
}

const initialState: State = {
    _model: null,
    _adjointModel: null,
};

export const InfoStore = signalStore(
    withState(initialState),
    withProps(() => {
        const mathJs = inject(MATH_JS);

        return {
            _mathJs: mathJs,
        };
    }),
    withComputed((store) => {
        const modelExpressions: Signal<ExpressionsGroup[]> = computed(
            (): ExpressionsGroup[] => {
                const model: Model | null = store._model();

                if (!model) {
                    return [];
                }

                const compartmentsExpressions: string[] =
                    model.compartments.map(
                        (compartment: Compartment): string => {
                            const connectedFlows: Flow[] = model.flows.filter(
                                (flow: Flow): boolean =>
                                    flow.source === compartment.id ||
                                    flow.target === compartment.id,
                            );
                            const compartmentTex: string = store._mathJs
                                .parse(compartment.name)
                                .toTex();
                            const leftSideTex: string = `\\frac{${compartmentTex}\\left(t\\right)}{dt} = `;
                            let isExpressionEmpty: boolean = true;

                            return connectedFlows.length
                                ? connectedFlows.reduce(
                                      (tex: string, flow: Flow): string => {
                                          const flowTex: string = store._mathJs
                                              .parse(flow.equation)
                                              .toTex();

                                          if (flow.source === compartment.id) {
                                              tex += `- (${flowTex})`;

                                              isExpressionEmpty = false;
                                          }

                                          if (flow.target === compartment.id) {
                                              const signString: string =
                                                  isExpressionEmpty ? '' : '+';

                                              tex += `${signString} (${flowTex})`;

                                              isExpressionEmpty = false;
                                          }

                                          return tex;
                                      },
                                      leftSideTex,
                                  )
                                : leftSideTex + '0';
                        },
                    );
                const constantsExpressions: string[] = model.constants.map(
                    (constant: Constant): string => {
                        const constantTex: string = store._mathJs
                            .parse(constant.name)
                            .toTex();

                        return `${constantTex} = ${constant.value}`;
                    },
                );
                const interventionsExpressions: string[] =
                    model.interventions.map(
                        (intervention: Intervention): string => {
                            const interventionTex: string = store._mathJs
                                .parse(intervention.name)
                                .toTex();

                            return `${interventionTex} = ${interventionTex}(t)`;
                        },
                    );

                return [
                    {
                        name: 'Compartments',
                        expressions: compartmentsExpressions,
                    },
                    {
                        name: 'Constants',
                        expressions: constantsExpressions,
                    },
                    {
                        name: 'Interventions',
                        expressions: interventionsExpressions,
                    },
                ];
            },
        );

        const adjointModelExpressions: Signal<ExpressionsGroup[]> = computed(
            (): ExpressionsGroup[] => {
                const adjointModel: Record<string, string> | null =
                    store._adjointModel();

                if (!adjointModel || !Object.keys(adjointModel).length) {
                    return [];
                }

                const adjointExpressions: string[] = Object.entries(
                    adjointModel,
                ).map(([name, rightSide]): string => {
                    const adjointTex: string = store._mathJs
                        .parse(name)
                        .toTex();

                    return (
                        `\\frac{${adjointTex}\\left(t\\right)}{dt} = ` +
                        store._mathJs.parse(rightSide).toTex()
                    );
                });

                return [
                    {
                        name: 'Adjoint Model',
                        expressions: adjointExpressions,
                    },
                ];
            },
        );

        return {
            modelExpressions,
            adjointModelExpressions,
        };
    }),
    withMethods((store) => {
        const setModel = (model: Model | null) =>
            patchState(store, {
                _model: model,
            });
        const setAdjointModel = (adjointModel: Record<string, string> | null) =>
            patchState(store, {
                _adjointModel: adjointModel,
            });

        return {
            setModel,
            setAdjointModel,
        };
    }),
);
