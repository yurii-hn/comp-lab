import { computed, inject, Signal } from '@angular/core';
import {
  Data,
  InterpolationType,
  OptimalControlParameters,
  ProcessingType,
} from '@core/types/processing';
import {
  OptimalControlResult,
  PIResult,
  Result,
  SimulationResult,
} from '@core/types/run.types';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
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

export interface SplitAreasSizes {
    plots: number;
    info: '*';
}

export interface Plot {
    data: PlotData[];
    layout: Partial<Layout>;
}

export interface State {
    splitAreasSizes: SplitAreasSizes;
    plotsConfig: Partial<Config>;
    plotStyle: Record<string, string>;
}

const initialState: State = {
    splitAreasSizes: {
        plots: 70,
        info: '*',
    },
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

        const settings: Signal<DashboardSettings> = globalStore.selectSignal(
            selectDashboardSettings
        );

        const noRuns: Signal<boolean> =
            globalStore.selectSignal(selectIsRunsEmpty);

        const runsNames: Signal<string[]> =
            globalStore.selectSignal(selectRunNames);

        const currentRunName: Signal<string | null> =
            globalStore.selectSignal(selectCurrentRunName);

        const currentRunData: Signal<Result | null> =
            globalStore.selectSignal(selectCurrentRunData);

        return {
            settings,
            noRuns,
            runsNames,
            currentRunName,
            currentRunData,
        };
    }),
    withComputed((store) => {
        const currentRunPlotsData: Signal<Plot[]> = computed((): Plot[] => {
            const dashboardSettings: DashboardSettings = store.settings();
            const data: Result | null = store.currentRunData();

            if (!data) {
                return [];
            }

            switch (data.type) {
                case ProcessingType.Simulation:
                    return getSimulationRunPlotData(data, dashboardSettings);

                case ProcessingType.OptimalControl:
                    return getOptimalControlRunPlotData(
                        data,
                        dashboardSettings
                    );

                case ProcessingType.PI:
                    return getPIRunPlotData(data, dashboardSettings);

                default:
                    throw new Error('Unknown processing mode');
            }
        });

        return {
            currentRunPlotsData,
        };
    }),
    withMethods((store) => {
        let alternator: 1 | -1 = -1;

        const alternateSplitAreasSizes = (): void => {
            const splitAreasSizes: SplitAreasSizes = store.splitAreasSizes();

            patchState(store, {
                splitAreasSizes: {
                    plots: splitAreasSizes.plots + 1e-10 * alternator,
                    info: '*',
                },
            });

            alternator *= -1;
        };

        return {
            alternateSplitAreasSizes,
        };
    })
);

function getSimulationRunPlotData(
    result: SimulationResult,
    settings: DashboardSettings
): Plot[] {
    return Object.entries(result.result.compartments).reduce(
        (plotsData: Plot[], [name, data]: [string, Data]): Plot[] => {
            const plotData: PlotData[] = [
                {
                    x: data.times,
                    y: data.values,
                    type: 'scatter',
                    name,
                    line: {
                        shape: 'linear',
                    },
                },
            ];

            plotsData[0].data.push(...plotData);

            plotsData.push({
                data: plotData,
                layout: {
                    autosize: true,
                    title: {
                        text: name,
                    },
                    xaxis: {
                        title: {
                            text: 'Time',
                        },
                    },
                    yaxis: {
                        rangemode: settings.yAxisRangeMode,
                        title: {
                            text: name,
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
        ]
    );
}

function getOptimalControlRunPlotData(
    result: OptimalControlResult,
    settings: DashboardSettings
): Plot[] {
    const plots: Plot[] = [];

    const parameters: OptimalControlParameters = result.parameters;

    const piecewiseConstantInterpolation: boolean =
        parameters.intervention.interpolationType ===
        InterpolationType.PiecewiseConstant;
    const lineShape: 'linear' | 'hv' = piecewiseConstantInterpolation
        ? 'hv'
        : 'linear';

    plots.push(
        ...Object.entries(result.result.noControlCompartments).map(
            ([name, data]: [string, Data]): Plot => {
                const optimalData: Data =
                    result.result.optimalCompartments[name];

                return {
                    data: [
                        {
                            x: data.times,
                            y: data.values,
                            type: 'scatter',
                            name: 'Initial',
                            line: {
                                shape: 'linear',
                            },
                        },
                        {
                            x: optimalData.times,
                            y: optimalData.values,
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
                            text: name,
                        },
                        xaxis: {
                            title: {
                                text: 'Time',
                            },
                        },
                        yaxis: {
                            rangemode: settings.yAxisRangeMode,
                            title: {
                                text: name,
                            },
                        },
                    },
                };
            }
        )
    );

    plots.push(
        ...Object.entries(result.result.interventions).map(
            ([name, data]: [string, Data]): Plot => ({
                data: [
                    {
                        x: data.times,
                        y: data.values,
                        type: 'scatter',
                        name,
                        line: {
                            shape: lineShape,
                        },
                    },
                ],
                layout: {
                    autosize: true,
                    title: {
                        text: name,
                    },
                    xaxis: {
                        title: {
                            text: 'Time',
                        },
                    },
                    yaxis: {
                        rangemode: settings.yAxisRangeMode,
                        title: {
                            text: name,
                        },
                    },
                },
            })
        )
    );

    return plots;
}

function getPIRunPlotData(
    result: PIResult,
    settings: DashboardSettings
): Plot[] {
    return [
        ...Object.entries(result.result.approximation).map(
            ([name, data]: [string, Data]): Plot => {
                return {
                    data: [
                        {
                            x: data.times,
                            y: data.values,
                            type: 'scatter',
                            name: 'Approximated',
                            line: {
                                shape: 'linear',
                            },
                        },
                        ...(name in result.parameters.data
                            ? [
                                  {
                                      x: result.parameters.data[name].times,
                                      y: result.parameters.data[name].values,
                                      type: 'scatter' as const,
                                      name: 'Provided',
                                      mode: 'markers' as const,
                                  },
                              ]
                            : []),
                    ],
                    layout: {
                        autosize: true,
                        title: {
                            text: name,
                        },
                        xaxis: {
                            title: {
                                text: 'Time',
                            },
                        },
                        yaxis: {
                            rangemode: settings.yAxisRangeMode,
                            title: {
                                text: name,
                            },
                        },
                    },
                };
            }
        ),
    ];
}
