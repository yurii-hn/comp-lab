import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Config, Data, Layout } from 'plotly.js';
import {
    ICompartmentSimulatedData,
    ISimulationResults,
} from 'src/app/core/interfaces';

@Component({
    selector: 'app-simulation-dashboard',
    templateUrl: './simulation-dashboard.component.html',
    styleUrls: ['./simulation-dashboard.component.scss'],
})
export class SimulationDashboardComponent implements OnInit {
    public readonly plotsData: Data[][] = [];

    public readonly plotsLayout: Partial<Layout> = {
        autosize: true,
    };

    public readonly plotsConfig: Partial<Config> = {};

    public readonly plotStyle: Record<string, string> = {
        position: 'relative',
        width: '100%',
        height: '100%',
    };

    constructor(
        private readonly dialogRef: MatDialogRef<SimulationDashboardComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: ISimulationResults
    ) {}

    public ngOnInit(): void {
        const xAxis: number[] = this.getXAxis(this.data.time, this.data.step);

        this.data.compartments.forEach((compartment) =>
            this.addPlot(xAxis, compartment)
        );
    }

    public closeDialog(): void {
        this.dialogRef.close();
    }

    private addPlot(
        xAxis: number[],
        compartment: ICompartmentSimulatedData
    ): void {
        this.plotsData.push([
            {
                x: xAxis,
                y: compartment.values,
                type: 'scatter',
                name: compartment.id,
            },
        ]);
    }

    private getXAxis(time: number, step: number): number[] {
        const xAxis: number[] = [];

        for (let i = 0; i <= time; i += step) {
            xAxis.push(i);
        }

        return xAxis;
    }
}
