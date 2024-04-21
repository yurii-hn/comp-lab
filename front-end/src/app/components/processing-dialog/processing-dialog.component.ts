import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
    IOptimalControlParameters,
    IPIParameters,
    IProcessingDialogPIValue,
    IProcessingDialogValue,
    ISimulationParameters,
    ProcessingType,
} from '@core/types/processing';

@Component({
    selector: 'app-processing-dialog',
    templateUrl: './processing-dialog.component.html',
    styleUrls: ['./processing-dialog.component.scss'],
})
export class ProcessingDialogComponent {
    public selectedProcessingType: ProcessingType = ProcessingType.Simulation;

    public readonly formGroup: FormGroup = new FormGroup({
        simulationParameters: new FormControl<ISimulationParameters | null>(
            null
        ),
        optimalControlParameters:
            new FormControl<IOptimalControlParameters | null>(null),
        parametersIdentificationParameters:
            new FormControl<IPIParameters | null>(null),
    });

    public get isValid(): boolean {
        return this.getCurrentParametersControl().valid;
    }

    constructor(
        private readonly dialogRef: MatDialogRef<
            ProcessingDialogComponent,
            IProcessingDialogValue
        >
    ) {}

    public closeDialog(): void {
        this.dialogRef.close(null);
    }

    public process(): void {
        let output: IProcessingDialogValue;

        switch (this.selectedProcessingType) {
            case ProcessingType.Simulation:
                output = {
                    parameters: this.formGroup.get('simulationParameters')
                        ?.value as ISimulationParameters,
                };

                break;

            case ProcessingType.OptimalControl:
                output = {
                    parameters: this.formGroup.get('optimalControlParameters')
                        ?.value as IOptimalControlParameters,
                };

                break;

            case ProcessingType.ParametersIdentification:
                const inputData: Omit<
                    IProcessingDialogPIValue,
                    'processingType'
                > = this.formGroup.get(
                    'parametersIdentificationParameters'
                )?.value;

                output = {
                    parameters: inputData.parameters,
                    solution: inputData.solution,
                };

                break;
        }

        this.dialogRef.close(output);
    }

    private getCurrentParametersControl(): FormControl {
        switch (this.selectedProcessingType) {
            case ProcessingType.Simulation:
                return this.formGroup.get(
                    'simulationParameters'
                ) as FormControl;

            case ProcessingType.OptimalControl:
                return this.formGroup.get(
                    'optimalControlParameters'
                ) as FormControl;

            case ProcessingType.ParametersIdentification:
                return this.formGroup.get(
                    'parametersIdentificationParameters'
                ) as FormControl;
        }
    }
}
