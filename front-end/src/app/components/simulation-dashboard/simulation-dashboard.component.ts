import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Config, Data, Layout } from 'plotly.js';
import { Subscription, take, tap } from 'rxjs';
import {
    ICompartmentResponseData,
    IInterventionResponseData,
    IOptimalControlResults,
    IResponseData,
    IResults,
    OptimalControlResultsViewMode,
} from 'src/app/core/interfaces';
import { isOptimalControlResults } from 'src/app/core/utils';
import { ResultsStorageService } from 'src/app/services/results-storage.service';

interface IPlot {
    data: Data[];
    layout: Partial<Layout>;
}

@Component({
    selector: 'app-simulation-dashboard',
    templateUrl: './simulation-dashboard.component.html',
    styleUrls: ['./simulation-dashboard.component.scss'],
})
export class SimulationDashboardComponent implements OnInit, OnDestroy {
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
        public readonly resultsStorageService: ResultsStorageService,
        private readonly dialogRef: MatDialogRef<SimulationDashboardComponent>
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
                        this.addPlot(compartment, 'hv');
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
            this.resultsStorageService.currentResults.data.parameters.nodesAmount
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
