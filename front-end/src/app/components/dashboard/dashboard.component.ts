import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataDefinition } from '@core/types/definitions.types';
import {
    ApproximationType,
    IOptimalControlParameters,
    IPoint,
    IValues,
} from '@core/types/processing';
import { isPIParameters } from '@core/types/processing/parameters-identification.guards';
import {
    isOptimalControlRun,
    isPIRun,
    isSimulationRun,
} from '@core/types/run.guards';
import {
    OptimalControlRun,
    PIRun,
    Run,
    SimulationRun,
} from '@core/types/run.types';
import { IOutputData, SplitComponent } from 'angular-split';
import { Config, Layout, Data as PlotData } from 'plotly.js';
import { Subscription, filter, map, tap } from 'rxjs';
import { FilesService } from 'src/app/services/files.service';
import { RunsService } from 'src/app/services/runs.service';
import { WorkspacesService } from 'src/app/services/workspaces.service';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';

interface IPlot {
    data: PlotData[];
    layout: Partial<Layout>;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
    @ViewChild(SplitComponent) private readonly splitComponent!: SplitComponent;

    private readonly subscriptions: Subscription = new Subscription();

    public plotsData: IPlot[] = [];

    public readonly control: FormControl = new FormControl();
    public readonly plotsConfig: Partial<Config> = {};
    public readonly plotStyle: Record<string, string> = {
        position: 'relative',
        width: '100%',
        height: '100%',
    };

    constructor(
        private readonly dialogRef: MatDialogRef<DashboardComponent>,
        private readonly snackBar: MatSnackBar,
        private readonly dialog: MatDialog,
        private readonly filesService: FilesService,
        public readonly workspacesService: WorkspacesService,
        public readonly runsService: RunsService
    ) {}

    public ngOnInit(): void {
        const nameSub: Subscription = this.runsService.current$
            .pipe(
                filter((run: Run): boolean => !!run.name),
                map((run: Run): string => run.name),
                tap(this.setName.bind(this))
            )
            .subscribe();

        const changeSub: Subscription = this.control.valueChanges
            .pipe(tap(this.set.bind(this)))
            .subscribe();

        this.render();

        this.subscriptions.add(nameSub);
        this.subscriptions.add(changeSub);
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    public onClose(): void {
        this.dialogRef.close();
    }

    public add(): void {
        this.subscriptions.add(
            this.filesService
                .readDataFromFile<DataDefinition>('.scr')
                .pipe(
                    tap((data: DataDefinition): void => {
                        this.runsService.add(data, true);
                        this.render();

                        this.snackBar.open(
                            'Run imported successfully',
                            'Dismiss',
                            {
                                panelClass: 'snackbar',
                                horizontalPosition: 'right',
                                verticalPosition: 'bottom',
                                duration: 5000,
                            }
                        );
                    })
                )
                .subscribe()
        );
    }

    public remove(): void {
        this.runsService.remove();
        this.render();
    }

    public get(): void {
        const dialog: MatDialogRef<ConfirmationDialogComponent, boolean> =
            this.dialog.open(ConfirmationDialogComponent, {
                data: {
                    title: 'Export run',
                    message: 'What you want to export?',
                    confirmText: 'Values and parameters',
                    cancelText: 'Values only',
                },
            });

        this.subscriptions.add(
            dialog
                .afterClosed()
                .pipe(
                    filter(
                        (withParameters?: boolean): withParameters is boolean =>
                            withParameters !== undefined
                    ),
                    tap((withParameters: boolean): void => {
                        const filename: string = `${this.workspacesService.current.name}-${this.runsService.current.name}`;

                        if (withParameters) {
                            this.filesService.downloadFileWithData(
                                this.runsService.data,
                                `${filename}.scr`
                            );

                            return;
                        }

                        this.filesService.downloadFileWithData(
                            this.runsService.values,
                            `${filename}.scs`
                        );
                    }),
                    tap((): void => {
                        this.snackBar.open(
                            'Run export is ready for downloading',
                            'Dismiss',
                            {
                                panelClass: 'snackbar',
                                horizontalPosition: 'right',
                                verticalPosition: 'bottom',
                                duration: 5000,
                            }
                        );
                    })
                )
                .subscribe()
        );
    }

    public onGutterDBClick(event: IOutputData): void {
        this.splitComponent.setVisibleAreaSizes([70, 30]);
    }

    private setName(name: string): void {
        this.control.setValue(name, {
            emitEvent: false,
        });
    }

    private set(name: string): void {
        this.runsService.set(name);
        this.render();
    }

    private render(): void {
        const run: Run = this.runsService.current;

        this.plotsData = [];

        if (isSimulationRun(run)) {
            this.renderSimulationRun(run);
        } else if (isOptimalControlRun(run)) {
            this.renderOptimalControlRun(run);
        } else if (isPIRun(run)) {
            this.renderPIRun(run);
        }
    }

    private renderSimulationRun(run: SimulationRun): void {
        this.plotsData = run.data.result.compartments.map(
            (compartment: IValues): IPlot => {
                const x: number[] = [];
                const y: number[] = [];

                compartment.values.forEach((point: IPoint): void => {
                    x.push(point.time);
                    y.push(point.value);
                });

                return {
                    data: [
                        {
                            x,
                            y,
                            type: 'scatter',
                            name: compartment.name,
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
                            rangemode: 'tozero',
                            title: {
                                text: compartment.name,
                            },
                        },
                    },
                };
            }
        );
    }

    private renderOptimalControlRun(run: OptimalControlRun): void {
        const parameters: IOptimalControlParameters = run.data.parameters;

        const piecewiseConstantApproximation: boolean =
            parameters.intervention.approximationType ===
            ApproximationType.PiecewiseConstant;
        const lineShape: 'linear' | 'hv' = piecewiseConstantApproximation
            ? 'hv'
            : 'linear';

        this.plotsData = run.data.result[0].compartments.map(
            (compartment: IValues): IPlot => {
                const x: number[] = [];
                const yNonOptimal: number[] = [];
                const yOptimal: number[] = [];

                compartment.values.forEach((point: IPoint): void => {
                    x.push(point.time);
                    yNonOptimal.push(point.value);
                });

                run.data.result[1].compartments
                    .find(
                        (optimalCompartment: IValues): boolean =>
                            optimalCompartment.name === compartment.name
                    )!
                    .values.forEach((point: IPoint): void => {
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
                            rangemode: 'tozero',
                            title: {
                                text: compartment.name,
                            },
                        },
                    },
                };
            }
        );

        this.plotsData.push(
            ...run.data.result[1].interventions.map(
                (intervention: IValues): IPlot => {
                    const x: number[] = [];
                    const y: number[] = [];

                    intervention.values.forEach((point: IPoint): void => {
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
                                rangemode: 'tozero',
                                title: {
                                    text: intervention.name,
                                },
                            },
                        },
                    };
                }
            )
        );
    }

    private renderPIRun(run: PIRun): void {
        const {
            dataCompartments,
            dataInterventions,
        }: {
            dataCompartments: IValues[];
            dataInterventions: IValues[];
        } = run.data.parameters.data.reduce(
            (
                accumulator: {
                    dataCompartments: IValues[];
                    dataInterventions: IValues[];
                },
                data: IValues
            ): {
                dataCompartments: IValues[];
                dataInterventions: IValues[];
            } => {
                if (
                    run.data.result.approximation.find(
                        (approximation: IValues): boolean =>
                            approximation.name === data.name
                    )
                ) {
                    accumulator.dataCompartments.push(data);

                    return accumulator;
                }

                accumulator.dataInterventions.push(data);

                return accumulator;
            },
            { dataCompartments: [], dataInterventions: [] }
        );

        this.plotsData = run.data.result.approximation.map(
            (compartment: IValues): IPlot => {
                const xApproximated: number[] = [];
                const yApproximated: number[] = [];

                const xData: number[] = [];
                const yData: number[] = [];

                compartment.values.forEach((point: IPoint): void => {
                    xApproximated.push(point.time);
                    yApproximated.push(point.value);
                });

                dataCompartments
                    .find(
                        (providedValues: IValues): boolean =>
                            providedValues.name === compartment.name
                    )
                    ?.values?.forEach((point: IPoint): void => {
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
                            rangemode: 'tozero',
                            title: {
                                text: compartment.name,
                            },
                        },
                    },
                };
            }
        );

        if (isPIParameters(run.data.parameters)) {
            this.plotsData.push(
                ...dataInterventions.map((intervention: IValues): IPlot => {
                    const x: number[] = [];
                    const y: number[] = [];

                    intervention.values.forEach((point: IPoint): void => {
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
                                rangemode: 'tozero',
                                title: {
                                    text: intervention.name,
                                },
                            },
                        },
                    };
                })
            );
        }
    }
}
