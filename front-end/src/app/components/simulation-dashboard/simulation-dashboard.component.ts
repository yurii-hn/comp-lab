import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Config, Data, Layout } from 'plotly.js';
import { Subscription, take, tap } from 'rxjs';
import {
    ICompartmentSimulatedData,
    IInterventionSimulatedData,
    IResults,
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
    public readonly resultsControl: FormControl = new FormControl();

    public readonly plotsConfig: Partial<Config> = {};

    public readonly plotStyle: Record<string, string> = {
        position: 'relative',
        width: '100%',
        height: '100%',
    };
    public plotsData: IPlot[] = [];

    private readonly subscriptions: Subscription = new Subscription();

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

        this.resultsStorageService.currentResults.data.compartments.forEach(
            (compartment: ICompartmentSimulatedData): void => {
                this.addPlot(compartment);
            }
        );

        if (
            isOptimalControlResults(
                this.resultsStorageService.currentResults.data
            )
        ) {
            this.resultsStorageService.currentResults.data.interventions.forEach(
                (intervention: IInterventionSimulatedData): void => {
                    this.addPlot(intervention, 'hv', true);
                }
            );
        }
    }

    private addPlot(
        compartment: ICompartmentSimulatedData,
        lineShape?:
            | 'linear'
            | 'spline'
            | 'hv'
            | 'vh'
            | 'hvh'
            | 'vhv'
            | undefined,
        isIntervention: boolean = false
    ): void {
        const xAxis: number[] = this.getXAxis(
            this.resultsStorageService.currentResults.data.time,
            compartment.values.length,
            isIntervention
        );

        this.plotsData.push({
            data: [
                {
                    x: xAxis,
                    y: isIntervention
                        ? [
                              ...compartment.values,
                              compartment.values.at(-1) as number,
                          ]
                        : compartment.values,
                    type: 'scatter',
                    name: compartment.name,
                    line: {
                        shape: lineShape,
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
                    title: {
                        text: compartment.name,
                    },
                },
            },
        });
    }

    private clearPlots(): void {
        this.plotsData = [];
    }

    private getXAxis(
        time: number,
        nodesAmount: number,
        isIntervention: boolean = false
    ): number[] {
        const xAxis: number[] = [];
        const step: number = time / nodesAmount;

        for (let i = 0; i <= time; i += step) {
            xAxis.push(i);
        }

        if (isIntervention) {
            xAxis.push(time);
        }

        return xAxis;
    }
}
