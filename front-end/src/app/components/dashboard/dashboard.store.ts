import { computed, inject, Signal } from '@angular/core';
import {
  ApproximationType,
  OptimalControlParameters,
  Point,
  ProcessingType,
  Values,
} from '@core/types/processing';
import {
  Data,
  OptimalControlData,
  PIData,
  SimulationData,
} from '@core/types/run.types';
import { signalStore, withComputed, withProps, withState } from '@ngrx/signals';
import { Store } from '@ngrx/store';
import { Config, Layout, Data as PlotData } from 'plotly.js-dist-min';
import { DashboardSettings } from 'src/app/state/reducers/settings.reducer';
import {
  selectCurrentRunData,
  selectCurrentRunName,
  selectIsRunsEmpty,
  selectRunNames,
} from 'src/app/state/selectors/runs.selectors';
import { selectDashboardSettings } from 'src/app/state/selectors/settings.selectors';

export interface Plot {
    data: PlotData[];
    layout: Partial<Layout>;
}

export interface State {
    plotsConfig: Partial<Config>;
    plotStyle: Record<string, string>;
}

const initialState: State = {
    plotsConfig: {},
    plotStyle: {
        position: 'relative',
        width: '100%',
        height: '100%',
    },
};

export const DashboardStore = signalStore(
    withState(initialState),
    withProps(() => {
        const globalStore: Store = inject(Store);

        return {
            _globalStore: globalStore,
        };
    }),
    withComputed((store) => {
        const settings: Signal<DashboardSettings> =
            store._globalStore.selectSignal(selectDashboardSettings);

        const noRuns: Signal<boolean> =
            store._globalStore.selectSignal(selectIsRunsEmpty);

        const runsNames: Signal<string[]> =
            store._globalStore.selectSignal(selectRunNames);

        const currentRunName: Signal<string | null> =
            store._globalStore.selectSignal(selectCurrentRunName);

        const currentRunData: Signal<Data | null> =
            store._globalStore.selectSignal(selectCurrentRunData);

        const currentRunPlotsData: Signal<Plot[]> = computed((): Plot[] => {
            const dashboardSettings: DashboardSettings = settings();
            const data: Data | null = currentRunData();

            if (!data) {
                return [];
            }

            switch (data.type) {
                case ProcessingType.Simulation:
                    return getSimulationRunPlotData(data, dashboardSettings);

                case ProcessingType.OptimalControl:
                    return getOptimalControlRunPlotData(
                        data,
                        dashboardSettings,
                    );

                case ProcessingType.PI:
                    return getPIRunPlotData(data, dashboardSettings);

                default:
                    throw new Error('Unknown processing mode');
            }
        });

        return {
            settings,
            noRuns,
            runsNames,
            currentRunName,
            currentRunData,
            currentRunPlotsData,
        };
    }),
);

function getSimulationRunPlotData(
    data: SimulationData,
    settings: DashboardSettings,
): Plot[] {
    return data.result.compartments.reduce(
        (plotsData: Plot[], compartment: Values): Plot[] => {
            const x: number[] = [];
            const y: number[] = [];

            compartment.values.forEach((point: Point): void => {
                x.push(point.time);
                y.push(point.value);
            });

            const data: PlotData[] = [
                {
                    x,
                    y,
                    type: 'scatter',
                    name: compartment.name,
                    line: {
                        shape: 'linear',
                    },
                },
            ];

            plotsData[0].data.push(...data);

            plotsData.push({
                data,
                layout: {
                    autosize: true,
                    title: {
                        text: compartment.name,
                    },
                    xaxis: {
                        title: {
                            text: 'Time',
                        },
                    },
                    yaxis: {
                        rangemode: settings.yAxisRangeMode,
                        title: {
                            text: compartment.name,
                        },
                    },
                },
            });

            return plotsData;
        },
        [
            {
                data: [],
                layout: {
                    autosize: true,
                    title: {
                        text: 'All compartments',
                    },
                    xaxis: {
                        title: {
                            text: 'Time',
                        },
                    },
                    yaxis: {
                        title: {
                            text: 'Value',
                        },
                    },
                },
            },
        ],
    );
}

function getOptimalControlRunPlotData(
    data: OptimalControlData,
    settings: DashboardSettings,
): Plot[] {
    const plots: Plot[] = [];

    const parameters: OptimalControlParameters = data.parameters;

    const piecewiseConstantApproximation: boolean =
        parameters.intervention.approximationType ===
        ApproximationType.PiecewiseConstant;
    const lineShape: 'linear' | 'hv' = piecewiseConstantApproximation
        ? 'hv'
        : 'linear';

    plots.push(
        ...data.result[0].compartments.map((compartment: Values): Plot => {
            const x: number[] = [];
            const yNonOptimal: number[] = [];
            const yOptimal: number[] = [];

            compartment.values.forEach((point: Point): void => {
                x.push(point.time);
                yNonOptimal.push(point.value);
            });

            data.result[1].compartments
                .find(
                    (optimalCompartment: Values): boolean =>
                        optimalCompartment.name === compartment.name,
                )!
                .values.forEach((point: Point): void => {
                    yOptimal.push(point.value);
                });

            return {
                data: [
                    {
                        x,
                        y: yNonOptimal,
                        type: 'scatter',
                        name: 'Initial',
                        line: {
                            shape: 'linear',
                        },
                    },
                    {
                        x,
                        y: yOptimal,
                        type: 'scatter',
                        name: 'Optimal',
                        line: {
                            shape: 'linear',
                        },
                    },
                ],
                layout: {
                    autosize: true,
                    title: {
                        text: compartment.name,
                    },
                    xaxis: {
                        title: {
                            text: 'Time',
                        },
                    },
                    yaxis: {
                        rangemode: settings.yAxisRangeMode,
                        title: {
                            text: compartment.name,
                        },
                    },
                },
            };
        }),
    );

    plots.push(
        ...data.result[1].interventions.map((intervention: Values): Plot => {
            const x: number[] = [];
            const y: number[] = [];

            intervention.values.forEach((point: Point): void => {
                x.push(point.time);
                y.push(point.value);
            });

            if (piecewiseConstantApproximation) {
                x.push(parameters.time);
                y.push(intervention.values.at(-1)!.value);
            }

            return {
                data: [
                    {
                        x,
                        y,
                        type: 'scatter',
                        name: intervention.name,
                        line: {
                            shape: lineShape,
                        },
                    },
                ],
                layout: {
                    autosize: true,
                    title: {
                        text: intervention.name,
                    },
                    xaxis: {
                        title: {
                            text: 'Time',
                        },
                    },
                    yaxis: {
                        rangemode: settings.yAxisRangeMode,
                        title: {
                            text: intervention.name,
                        },
                    },
                },
            };
        }),
    );

    return plots;
}

function getPIRunPlotData(data: PIData, settings: DashboardSettings): Plot[] {
    interface ProvidedValues {
        compartments: Values[];
        interventions: Values[];
    }

    const plots: Plot[] = [];

    const providedValues: ProvidedValues = data.parameters.data.reduce(
        (providedValues: ProvidedValues, values: Values): ProvidedValues => {
            if (
                data.result.approximation.find(
                    (approximation: Values): boolean =>
                        approximation.name === values.name,
                )
            ) {
                providedValues.compartments.push(values);

                return providedValues;
            }

            providedValues.interventions.push(values);

            return providedValues;
        },
        { compartments: [], interventions: [] },
    );

    plots.push(
        ...data.result.approximation.map((compartment: Values): Plot => {
            const xApproximated: number[] = [];
            const yApproximated: number[] = [];

            const xData: number[] = [];
            const yData: number[] = [];

            compartment.values.forEach((point: Point): void => {
                xApproximated.push(point.time);
                yApproximated.push(point.value);
            });

            providedValues.compartments
                .find(
                    (providedValues: Values): boolean =>
                        providedValues.name === compartment.name,
                )
                ?.values?.forEach((point: Point): void => {
                    xData.push(point.time);
                    yData.push(point.value);
                });

            const data: PlotData[] = [
                {
                    x: xApproximated,
                    y: yApproximated,
                    type: 'scatter',
                    name: 'Approximated',
                    line: {
                        shape: 'linear',
                    },
                },
            ];

            if (yData.length) {
                data.push({
                    x: xData,
                    y: yData,
                    type: 'scatter',
                    name: 'Provided',
                    mode: 'markers',
                });
            }

            return {
                data,
                layout: {
                    autosize: true,
                    title: {
                        text: compartment.name,
                    },
                    xaxis: {
                        title: {
                            text: 'Time',
                        },
                    },
                    yaxis: {
                        rangemode: settings.yAxisRangeMode,
                        title: {
                            text: compartment.name,
                        },
                    },
                },
            };
        }),
    );

    plots.push(
        ...providedValues.interventions.map((intervention: Values): Plot => {
            const x: number[] = [];
            const y: number[] = [];

            intervention.values.forEach((point: Point): void => {
                x.push(point.time);
                y.push(point.value);
            });

            return {
                data: [
                    {
                        x,
                        y,
                        type: 'scatter',
                        name: intervention.name,
                        line: {
                            shape: 'linear',
                        },
                    },
                ],
                layout: {
                    autosize: true,
                    title: {
                        text: intervention.name,
                    },
                    xaxis: {
                        title: {
                            text: 'Time',
                        },
                    },
                    yaxis: {
                        rangemode: settings.yAxisRangeMode,
                        title: {
                            text: intervention.name,
                        },
                    },
                },
            };
        }),
    );

    return plots;
}
