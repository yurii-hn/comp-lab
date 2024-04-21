import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    ICompartmentResponseData,
    IInterventionResponseData,
    IOptimalControlParameters,
    ISimulationParameters,
    InterventionApproximationType,
    isPIResponsePayloadWithInterventions,
} from '@core/types/processing';
import {
    IImportResults,
    IOptimalControlResults,
    IPIResults,
    IResults,
    IResultsBody,
    ISimulationResults,
    OptimalControlResultsViewMode,
    isOptimalControlResults,
    isPIResults,
    isSimulationResults,
} from '@core/types/results';
import { Config, Data, Layout } from 'plotly.js';
import { Subscription, filter, take, tap } from 'rxjs';
import { FilesService } from 'src/app/services/files.service';
import { ResultsStorageService } from 'src/app/services/results-storage.service';
import { WorkspacesService } from 'src/app/services/workspaces.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

interface IPlot {
    data: Data[];
    layout: Partial<Layout>;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
    public readonly viewModeControl: FormControl = new FormControl(
        OptimalControlResultsViewMode.NonOptimized
    );
    public readonly resultsControl: FormControl = new FormControl();

    public readonly plotsConfig: Partial<Config> = {};

    public readonly plotStyle: Record<string, string> = {
        position: 'relative',
        width: '100%',
        height: '100%',
    };

    public plotsData: IPlot[] = [];

    private readonly subscriptions: Subscription = new Subscription();

    public get isCurrentResultsOptimal(): boolean {
        return isOptimalControlResults(
            this.resultsStorageService.currentResults
        );
    }

    constructor(
        public readonly workspacesService: WorkspacesService,
        public readonly resultsStorageService: ResultsStorageService,
        private readonly dialogRef: MatDialogRef<DashboardComponent>,
        private readonly filesService: FilesService,
        private readonly snackBar: MatSnackBar,
        private readonly dialog: MatDialog
    ) {}

    public ngOnInit(): void {
        const resultsInitSub: Subscription =
            this.resultsStorageService.currentResults$
                .pipe(
                    take(2),
                    tap((results: IResults): void => {
                        this.resultsControl.setValue(results.name, {
                            emitEvent: false,
                        });

                        if (isOptimalControlResults(results)) {
                            this.viewModeControl.setValue(results.viewMode, {
                                emitEvent: false,
                            });
                        }
                    })
                )
                .subscribe();

        const resultsNamesSub: Subscription =
            this.resultsStorageService.resultsNames$
                .pipe(
                    tap((resultsNames: string[]): void => {
                        if (resultsNames.length === 0) {
                            this.resultsControl.disable({
                                emitEvent: false,
                            });

                            return;
                        }

                        this.resultsControl.enable({
                            emitEvent: false,
                        });
                    })
                )
                .subscribe();

        const viewModeChangeSub: Subscription =
            this.viewModeControl.valueChanges
                .pipe(
                    tap((viewMode: OptimalControlResultsViewMode): void => {
                        (
                            this.resultsStorageService
                                .currentResults as IOptimalControlResults
                        ).viewMode = viewMode;

                        this.onResultsChange();
                    })
                )
                .subscribe();

        const resultsChangeSub: Subscription = this.resultsControl.valueChanges
            .pipe(
                tap((resultsName: string): void => {
                    this.resultsStorageService.setCurrentResults(resultsName);

                    this.onResultsChange();
                })
            )
            .subscribe();

        this.onResultsChange();

        this.subscriptions.add(resultsInitSub);
        this.subscriptions.add(resultsNamesSub);
        this.subscriptions.add(viewModeChangeSub);
        this.subscriptions.add(resultsChangeSub);
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    public removeCurrentResults(): void {
        this.resultsStorageService.removeResults(
            this.resultsStorageService.currentResults.name
        );

        this.onResultsChange();
    }

    public onResultsImport(): void {
        this.filesService
            .readDataFromFile<IImportResults>('.scr')
            .pipe(
                tap((resultsData: IImportResults): void => {
                    this.resultsStorageService.addResults({
                        data: resultsData,
                    } as IResultsBody);

                    if (this.resultsStorageService.resultsNames.length === 1) {
                        this.onResultsChange();
                    }

                    this.snackBar.open(
                        'Results imported successfully',
                        'Dismiss',
                        {
                            panelClass: 'snackbar',
                            horizontalPosition: 'right',
                            verticalPosition: 'bottom',
                        }
                    );
                })
            )
            .subscribe();
    }

    public onResultsExport(): void {
        const exportTypeDialogRef: MatDialogRef<ConfirmationDialogComponent> =
            this.dialog.open(ConfirmationDialogComponent, {
                data: {
                    title: 'Export results',
                    message: 'What you want to export?',
                    confirmText: 'Solution with parameters',
                    cancelText: 'Solution only',
                },
            });

        exportTypeDialogRef
            .afterClosed()
            .pipe(
                filter(
                    (
                        isExportWithParameters?: boolean
                    ): isExportWithParameters is boolean =>
                        isExportWithParameters !== undefined
                ),
                tap((isExportWithParameters: boolean): void => {
                    const fileBaseName: string = `${this.workspacesService.currentWorkspace.name}-${this.resultsStorageService.currentResults.name}`;

                    if (isExportWithParameters) {
                        this.filesService.downloadFileWithData(
                            this.resultsStorageService.getCurrentResultsExport(),
                            `${fileBaseName}.scr`
                        );

                        return;
                    }

                    this.filesService.downloadFileWithData(
                        this.resultsStorageService.getCurrentSolutionExport(),
                        `${fileBaseName}.scs`
                    );
                }),
                tap((): void => {
                    this.snackBar.open(
                        'Results export is ready for downloading',
                        'Dismiss',
                        {
                            panelClass: 'snackbar',
                            horizontalPosition: 'right',
                            verticalPosition: 'bottom',
                        }
                    );
                })
            )
            .subscribe();
    }

    public closeDialog(): void {
        this.dialogRef.close();
    }

    private onResultsChange(): void {
        const currentResults: IResults =
            this.resultsStorageService.currentResults;

        if (isSimulationResults(currentResults)) {
            this.showSimulationResults(currentResults);
        } else if (isOptimalControlResults(currentResults)) {
            this.showOptimalControlResults(currentResults);
        } else if (isPIResults(currentResults)) {
            this.showPIResults(currentResults);
        }
    }

    private showSimulationResults(results: ISimulationResults): void {
        const resultsParameters: ISimulationParameters =
            results.data.parameters;

        const xAxis: number[] = this.getXAxis(
            resultsParameters.time,
            resultsParameters.nodesAmount
        );

        this.plotsData = results.data.payload.compartments.map(
            (compartment: ICompartmentResponseData): IPlot => ({
                data: [
                    {
                        x: xAxis,
                        y: compartment.values,
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
            })
        );
    }

    private showOptimalControlResults(results: IOptimalControlResults): void {
        const resultsParameters: IOptimalControlParameters =
            results.data.parameters;
        const payloadIndex: 0 | 1 =
            results.viewMode === OptimalControlResultsViewMode.NonOptimized
                ? 0
                : 1;

        const xAxisCompartments: number[] = this.getXAxis(
            resultsParameters.time,
            resultsParameters.nodesAmount
        );

        this.plotsData = results.data.payload[payloadIndex].compartments.map(
            (compartment: ICompartmentResponseData): IPlot => ({
                data: [
                    {
                        x: xAxisCompartments,
                        y: compartment.values,
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
            })
        );

        if (payloadIndex) {
            const xAxisInterventions: number[] = this.getXAxis(
                resultsParameters.time,
                resultsParameters.interventionNodesAmount
            );
            const lineShape: 'linear' | 'hv' =
                resultsParameters.interventionApproximationType ===
                InterventionApproximationType.PiecewiseConstant
                    ? 'hv'
                    : 'linear';
            const isPiecewiseConstantApproximation: boolean =
                resultsParameters.interventionApproximationType ===
                InterventionApproximationType.PiecewiseConstant;

            results.data.payload[payloadIndex].interventions.forEach(
                (intervention: IInterventionResponseData): void => {
                    this.plotsData.push({
                        data: [
                            {
                                x: xAxisInterventions,
                                y: [
                                    ...intervention.values,
                                    ...(isPiecewiseConstantApproximation
                                        ? [intervention.values.at(-1) as number]
                                        : []),
                                ],
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
                    });
                }
            );
        }
    }

    private showPIResults(results: IPIResults): void {
        const nodesAmount: number =
            results.data.payload.solution.compartments[0].values.length;
        const time: number = results.data.parameters.timeStep * nodesAmount;

        const xAxis: number[] = this.getXAxis(time, nodesAmount);

        this.plotsData = results.data.payload.solution.compartments.map(
            (compartment: ICompartmentResponseData, index: number): IPlot => ({
                data: [
                    {
                        x: xAxis,
                        y: results.data.payload.approximatedSolution[index]
                            .values,
                        type: 'scatter',
                        name: 'Approximated',
                        line: {
                            shape: 'linear',
                        },
                    },
                    {
                        x: xAxis,
                        y: compartment.values,
                        type: 'scatter',
                        name: 'Provided',
                        mode: 'markers',
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
            })
        );

        if (isPIResponsePayloadWithInterventions(results.data.payload)) {
            results.data.payload.solution.interventions.forEach(
                (intervention: IInterventionResponseData): void => {
                    this.plotsData.push({
                        data: [
                            {
                                x: xAxis,
                                y: intervention.values,
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
                    });
                }
            );
        }
    }

    private getXAxis(time: number, nodesAmount: number): number[] {
        const xAxis: number[] = [];
        const step: number = time / nodesAmount;

        for (let i: number = 0; i <= time; i += step) {
            xAxis.push(i);
        }

        return xAxis;
    }
}
