import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Config, Data, Layout } from 'plotly.js';
import {
    ICompartmentSimulatedData,
    IInterventionSimulatedData,
    ISimulationResultsSuccess,
} from 'src/app/core/interfaces';

interface IPlot {
    data: Data[];
    layout: Partial<Layout>;
}

@Component({
    selector: 'app-simulation-dashboard',
    templateUrl: './simulation-dashboard.component.html',
    styleUrls: ['./simulation-dashboard.component.scss'],
})
export class SimulationDashboardComponent implements OnInit {
    public readonly plotsData: IPlot[] = [];

    public readonly plotsConfig: Partial<Config> = {};

    public readonly plotStyle: Record<string, string> = {
        position: 'relative',
        width: '100%',
        height: '100%',
    };

    constructor(
        private readonly dialogRef: MatDialogRef<SimulationDashboardComponent>,
        @Inject(MAT_DIALOG_DATA)
        private readonly data: ISimulationResultsSuccess
    ) {}

    public ngOnInit(): void {
        this.data.compartments.forEach(
            (compartment: ICompartmentSimulatedData): void => {
                this.addPlot(compartment);
            }
        );

        this.data.interventions.forEach(
            (intervention: IInterventionSimulatedData): void => {
                this.addPlot(intervention, 'hv', true);
            }
        );
    }

    public closeDialog(): void {
        this.dialogRef.close();
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
            this.data.time,
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
