import { DataSource } from '@angular/cdk/collections';
import { Component, OnDestroy } from '@angular/core';
import {
    AbstractControl,
    FormArray,
    FormControl
} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription, filter, tap } from 'rxjs';
import { ModelService } from 'src/app/services/model.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'app-definitions-table-dialog',
    templateUrl: './definitions-table-dialog.component.html',
    styleUrls: ['./definitions-table-dialog.component.scss'],
})
export class DefinitionsTableDialogComponent implements OnDestroy {
    public readonly displayedColumns: string[] = [
        'name',
        'type',
        'value',
        'actions',
    ];
    public readonly definitionTypes: { text: string; value: string }[] = [
        { text: 'Compartment', value: 'compartment' },
        { text: 'Intervention', value: 'intervention' },
        { text: 'Constant', value: 'constant' },
    ];

    public readonly definitionsDataSource: DataSource<AbstractControl>;

    private readonly subscription: Subscription = new Subscription();

    constructor(
        private readonly dialogRef: MatDialogRef<DefinitionsTableDialogComponent>,
        private readonly modelService: ModelService,
        private readonly dialog: MatDialog
    ) {
        this.definitionsDataSource = this.modelService.getDataSource();
    }

    public isLast(formControl: FormControl): boolean {
        return (
            (formControl.parent as FormArray)!.controls[
                (formControl.parent as FormArray).controls.length - 1
            ] === formControl
        );
    }

    public closeDialog(): void {
        this.dialogRef.close();
    }

    public removeDefinition(definitionName: string): void {
        const confirmationDialogRef: MatDialogRef<ConfirmationDialogComponent> =
            this.dialog.open(ConfirmationDialogComponent, {
                data: {
                    title: `Removing ${definitionName}`,
                    message:
                        `Are you sure you want to remove "${definitionName}" definition?\n\n` +
                        `All ${definitionName} references will be removed as well.`,
                    confirmText: 'Remove',
                    cancelText: 'Cancel',
                },
            });

        const confirmationDialogSub: Subscription = confirmationDialogRef
            .afterClosed()
            .pipe(
                filter((result: boolean): boolean => result),
                tap((): void => {
                    this.modelService.removeDefinition(definitionName);
                })
            )
            .subscribe();

        this.subscription.add(confirmationDialogSub);
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}
