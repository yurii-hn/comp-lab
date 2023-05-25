import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
    ISimulationParameters
} from 'src/app/core/interfaces';

@Component({
    selector: 'app-simulation-dialog',
    templateUrl: './simulation-dialog.component.html',
    styleUrls: ['./simulation-dialog.component.scss'],
})
export class SimulationDialogComponent {
    public readonly formGroup: FormGroup = new FormGroup({
        time: new FormControl(null, [Validators.required]),
        step: new FormControl(null, [Validators.required]),
    });

    constructor(
        private readonly dialogRef: MatDialogRef<SimulationDialogComponent>
    ) {}

    public closeDialog(): void {
        this.dialogRef.close(null);
    }

    public simulate(): void {
        this.dialogRef.close(this.formGroup.value as ISimulationParameters);
    }
}
