import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-flow-creation-dialog',
    templateUrl: './flow-creation-dialog.component.html',
    styleUrls: ['./flow-creation-dialog.component.scss'],
})
export class FlowCreationDialogComponent {
    public readonly flowEquationFormControl: FormControl = new FormControl('', [
        Validators.required,
    ]);

    public get isEditMode(): boolean {
        return !!this.data;
    }

    constructor(
        private readonly dialogRef: MatDialogRef<FlowCreationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data?: string
    ) {
        if (data) {
            this.flowEquationFormControl.setValue(data);
        }
    }

    public closeDialog(): void {
        this.dialogRef.close(null);
    }

    public addCompartment(): void {
        this.dialogRef.close(this.flowEquationFormControl.value);
    }
}
