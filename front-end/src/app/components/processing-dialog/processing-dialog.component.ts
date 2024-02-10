import { Component, OnInit } from '@angular/core';
import {
    FormControl,
    FormGroup,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { tap } from 'rxjs';

@Component({
    selector: 'app-processing-dialog',
    templateUrl: './processing-dialog.component.html',
    styleUrls: ['./processing-dialog.component.scss'],
})
export class ProcessingDialogComponent implements OnInit {
    public readonly formGroup: FormGroup = new FormGroup({
        parameters: new FormGroup({
            time: new FormControl(null, [Validators.required]),
            nodesAmount: new FormControl(null, [Validators.required]),
            costFunction: new FormControl(null, [Validators.required]),
            interventionNodesAmount: new FormControl(null, [
                Validators.required,
            ]),
            interventionUpperBoundary: new FormControl(null, [
                Validators.required,
            ]),
            interventionLowerBoundary: new FormControl(null, [
                Validators.required,
            ]),
        }),
        isOptimalControlProblem: new FormControl(false),
    });

    public get isOptimalControlProblem(): boolean {
        return this.formGroup.get('isOptimalControlProblem')!.value;
    }

    constructor(
        private readonly dialogRef: MatDialogRef<ProcessingDialogComponent>
    ) {
        this.getParameterControl('costFunction').disable();
        this.getParameterControl('interventionNodesAmount').disable();
        this.getParameterControl('interventionUpperBoundary').disable();
        this.getParameterControl('interventionLowerBoundary').disable();
    }

    public ngOnInit(): void {
        this.formGroup
            .get('isOptimalControlProblem')!
            .valueChanges.pipe(
                tap((isOptimalControlProblem: boolean) => {
                    if (isOptimalControlProblem) {
                        this.getParameterControl('costFunction').enable();
                        this.getParameterControl(
                            'interventionNodesAmount'
                        ).enable();
                        this.getParameterControl('interventionUpperBoundary').enable();
                        this.getParameterControl('interventionLowerBoundary').enable();
                    } else {
                        this.getParameterControl('costFunction').disable();
                        this.getParameterControl(
                            'interventionNodesAmount'
                        ).disable();
                        this.getParameterControl('interventionUpperBoundary').disable();
                        this.getParameterControl('interventionLowerBoundary').disable();
                    }
                })
            )
            .subscribe();
    }

    public onErrorsChange(validationErrors: ValidationErrors | null): void {
        this.formGroup.setErrors(validationErrors);
    }

    public closeDialog(): void {
        this.dialogRef.close(null);
    }

    public process(): void {
        this.dialogRef.close(this.formGroup.value);
    }

    private getParameterControl(
        name:
            | 'time'
            | 'nodesAmount'
            | 'costFunction'
            | 'interventionNodesAmount'
            | 'interventionUpperBoundary'
            | 'interventionLowerBoundary'
    ): FormControl {
        return this.formGroup.get('parameters')!.get(name) as FormControl;
    }
}
