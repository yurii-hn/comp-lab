import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { IFlow } from 'src/app/core/interfaces';

@Component({
    selector: 'app-flow-creation-dialog',
    templateUrl: './flow-creation-dialog.component.html',
    styleUrls: ['./flow-creation-dialog.component.scss'],
})
export class FlowCreationDialogComponent {
    public readonly formGroup: FormGroup = new FormGroup({
        ratio: new FormControl(null, [Validators.required]),
        value: new FormControl(null, [Validators.required]),
    });

    constructor(
        private readonly dialogRef: MatDialogRef<FlowCreationDialogComponent>
    ) {}

    public closeDialog(): void {
        this.dialogRef.close(null);
    }

    public addCompartment(): void {
        this.dialogRef.close(this.formGroup.value as IFlow);
    }
}
