import { Component, computed, inject, Signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import {
  OptimalControlParameters,
  PIParameters,
  ProcessingType,
  SimulationParameters,
} from '@core/types/processing';
import { Store } from '@ngrx/store';
import { OptimalControlParametersInputComponent } from 'src/app/components/processing/optimal-control-parameters-input/optimal-control-parameters-input.component';
import { ParametersIdentificationParametersInputComponent } from 'src/app/components/processing/parameters-identification-parameters-input/parameters-identification-parameters-input.component';
import { ProcessingDialogStore } from 'src/app/components/processing/processing-dialog/processing-dialog.store';
import { SimulationParametersInputComponent } from 'src/app/components/processing/simulation-parameters-input/simulation-parameters-input.component';
import { ProcessingDialogActions } from 'src/app/state/actions/processing-dialog.actions';

@Component({
    selector: 'app-processing-dialog',
    imports: [
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatTabsModule,
        SimulationParametersInputComponent,
        OptimalControlParametersInputComponent,
        ParametersIdentificationParametersInputComponent,
    ],
    providers: [ProcessingDialogStore],
    templateUrl: './processing-dialog.component.html',
    styleUrls: ['./processing-dialog.component.scss'],
})
export class ProcessingDialogComponent {
    private readonly store: Store = inject(Store);
    private readonly localStore = inject(ProcessingDialogStore);
    private readonly dialogRef: MatDialogRef<ProcessingDialogComponent, void> =
        inject(MatDialogRef<ProcessingDialogComponent, void>);

    public typeIndex: Signal<number> = this.localStore.formValue;

    public readonly control: FormGroup = new FormGroup({
        simulation: new FormControl<SimulationParameters | null>(null),
        optimalControl: new FormControl<OptimalControlParameters | null>(null),
        parametersIdentification: new FormControl<PIParameters | null>(null),
    });

    public currentControl: Signal<FormControl> = computed((): FormControl => {
        switch (this.localStore.value()) {
            case ProcessingType.Simulation:
                return this.control.get('simulation') as FormControl;

            case ProcessingType.OptimalControl:
                return this.control.get('optimalControl') as FormControl;

            case ProcessingType.PI:
                return this.control.get(
                    'parametersIdentification',
                ) as FormControl;
        }
    });

    public onTypeChange(typeIndex: number): void {
        this.localStore.setValueFromForm(typeIndex);
    }

    public onClose(): void {
        this.dialogRef.close();
    }

    public onProcess(): void {
        this.store.dispatch(
            ProcessingDialogActions.processModel({
                parameters: this.currentControl().value,
                mode: this.localStore.value(),
            }),
        );

        this.dialogRef.close();
    }
}
