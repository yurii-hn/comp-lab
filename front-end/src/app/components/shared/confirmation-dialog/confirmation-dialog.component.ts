import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
}

@Component({
    selector: 'app-confirmation-dialog',
    imports: [MatIconModule, MatButtonModule],
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.scss'],
})
export class ConfirmationDialogComponent {
    private readonly dialogRef: MatDialogRef<
        ConfirmationDialogComponent,
        boolean
    > = inject(MatDialogRef<ConfirmationDialogComponent, boolean>);
    private readonly data: ConfirmationDialogData = inject(MAT_DIALOG_DATA);

    public readonly title: string = 'Confirmation';
    public readonly message: string = 'Are you sure you want to do this?';
    public readonly confirmText: string = 'Confirm';
    public readonly cancelText: string = 'Cancel';

    constructor() {
        if (this.data.title) {
            this.title = this.data.title;
        }

        if (this.data.message) {
            this.message = this.data.message;
        }

        if (this.data.confirmText) {
            this.confirmText = this.data.confirmText;
        }

        if (this.data.cancelText) {
            this.cancelText = this.data.cancelText;
        }
    }

    public close(): void {
        this.dialogRef.close();
    }

    public cancel(): void {
        this.dialogRef.close(false);
    }

    public confirm(): void {
        this.dialogRef.close(true);
    }
}
