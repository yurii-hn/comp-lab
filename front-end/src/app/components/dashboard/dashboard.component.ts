import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Config, Data, Layout } from 'plotly.js';
import { Subscription, take, tap } from 'rxjs';
import {
    ICompartmentResponseData,
    IExportResults,
    IImportResults,
    IInterventionResponseData,
    IOptimalControlResults,
    IResponseData,
    IResults,
    IResultsBase,
    InterventionApproximationType,
    OptimalControlResultsViewMode,
} from 'src/app/core/interfaces';
import { isOptimalControlResults } from 'src/app/core/utils';
import { ResultsStorageService } from 'src/app/services/results-storage.service';
import { WorkspacesService } from 'src/app/services/workspaces.service';

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
        private readonly snackBar: MatSnackBar
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
                        } else {
                            this.resultsControl.enable({
                                emitEvent: false,
                            });
                        }
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
        const fileInput: HTMLInputElement = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.scr';

        fileInput.onchange = (): void => {
            const file: File = fileInput.files![0];

            const fileReader: FileReader = new FileReader();

            fileReader.onload = (): void => {
                const resultsData: IImportResults = JSON.parse(
                    fileReader.result as string
                );

                this.resultsStorageService.addResults({
                    data: resultsData,
                } as IResultsBase);

                if (this.resultsStorageService.resultsNames.length === 1) {
                    this.onResultsChange();
                }

                this.snackBar.open('Results imported successfully', 'Dismiss', {
                    panelClass: 'snackbar',
                    horizontalPosition: 'right',
                    verticalPosition: 'bottom',
                });
            };

            fileReader.readAsText(file);
        };

        fileInput.click();

        fileInput.remove();
    }

    public onResultsExport(): void {
        const results: IExportResults =
            this.resultsStorageService.getCurrentResultsExport();
        const resultsString: string = JSON.stringify(results, null, 4);

        const blob: Blob = new Blob([resultsString], {
            type: 'application/json',
        });

        const url: string = URL.createObjectURL(blob);

        const anchor: HTMLAnchorElement = document.createElement('a');
        anchor.href = url;
        anchor.download = `${this.workspacesService.currentWorkspace.name}-${this.resultsStorageService.currentResults.name}.scr`;

        anchor.click();

        URL.revokeObjectURL(url);

        anchor.remove();

        this.snackBar.open(
            'Results export is ready for downloading',
            'Dismiss',
            {
                panelClass: 'snackbar',
                horizontalPosition: 'right',
                verticalPosition: 'bottom',
            }
        );
    }

    public closeDialog(): void {
        this.dialogRef.close();
    }

    private onResultsChange(): void {
        this.clearPlots();

        if (
            isOptimalControlResults(this.resultsStorageService.currentResults)
        ) {
            const payloadIndex: 0 | 1 =
                this.resultsStorageService.currentResults.viewMode ===
                OptimalControlResultsViewMode.NonOptimized
                    ? 0
                    : 1;

            this.resultsStorageService.currentResults.data.payload[
                payloadIndex
            ].compartments.forEach(
                (compartment: ICompartmentResponseData): void => {
                    this.addPlot(compartment);
                }
            );

            if (payloadIndex) {
                this.resultsStorageService.currentResults.data.payload[
                    payloadIndex
                ].interventions.forEach(
                    (compartment: IInterventionResponseData): void => {
                        const lineShape: 'linear' | 'hv' =
                            (
                                this.resultsStorageService
                                    .currentResults as IOptimalControlResults
                            ).data.parameters.interventionApproximationType ===
                            InterventionApproximationType.PiecewiseConstant
                                ? 'hv'
                                : 'linear';

                        this.addPlot(compartment, lineShape);
                    }
                );
            }

            return;
        }

        this.resultsStorageService.currentResults.data.payload.compartments.forEach(
            (compartment: ICompartmentResponseData): void => {
                this.addPlot(compartment);
            }
        );
    }

    private addPlot(
        data: IResponseData,
        lineShape?:
            | 'linear'
            | 'spline'
            | 'hv'
            | 'vh'
            | 'hvh'
            | 'vhv'
            | undefined
    ): void {
        const xAxis: number[] = this.getXAxis(
            this.resultsStorageService.currentResults.data.parameters.time,
            data.values.length
        );

        this.plotsData.push({
            data: [
                {
                    x: xAxis,
                    y: data.values,
                    type: 'scatter',
                    name: data.name,
                    line: {
                        shape: lineShape,
                    },
                },
            ],
            layout: {
                autosize: true,
                title: {
                    text: data.name,
                },
                xaxis: {
                    title: {
                        text: 'Time',
                    },
                },
                yaxis: {
                    rangemode: 'tozero',
                    title: {
                        text: data.name,
                    },
                },
            },
        });
    }

    private clearPlots(): void {
        this.plotsData = [];
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
