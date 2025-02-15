import {
  Component,
  effect,
  inject,
  Injector,
  OnInit,
  Signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { skip } from 'rxjs';
import {
  EditDialogData,
  EditDialogStore,
  EditInputType,
  FormValue,
} from 'src/app/components/shared/edit-dialog/edit-dialog.store';

@Component({
    selector: 'app-edit-dialog',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
    ],
    providers: [EditDialogStore],
    templateUrl: './edit-dialog.component.html',
    styleUrls: ['./edit-dialog.component.scss'],
})
export class EditDialogComponent implements OnInit {
    private readonly injector: Injector = inject(Injector);
    private readonly localStore = inject(EditDialogStore);
    private readonly dialogRef: MatDialogRef<
        EditDialogComponent,
        string | number
    > = inject(MatDialogRef<EditDialogComponent, string | number>);
    private readonly data: EditDialogData = inject(MAT_DIALOG_DATA);

    public readonly control: FormControl<string | number> = new FormControl<
        string | number
    >('', [Validators.required]) as FormControl<string | number>;

    public readonly title: Signal<string> = this.localStore.title;
    public readonly message: Signal<string> = this.localStore.message;
    public readonly type: Signal<EditInputType> = this.localStore.type;
    public readonly confirmText: Signal<string> = this.localStore.confirmText;
    public readonly cancelText: Signal<string> = this.localStore.cancelText;

    public ngOnInit(): void {
        const valueChanges: Signal<FormValue | undefined> = toSignal(
            this.control.valueChanges.pipe(skip(1)),
            {
                injector: this.injector,
            },
        );

        effect(
            (): void => {
                const change: FormValue | undefined = valueChanges();

                if (change === undefined) {
                    return;
                }

                untracked((): void => this.localStore.setValueFromForm(change));
            },
            {
                injector: this.injector,
            },
        );

        effect(
            (): void => {
                const formValue: FormValue = this.localStore.formValue();

                untracked((): void => this.control.setValue(formValue));
            },
            {
                injector: this.injector,
            },
        );

        this.localStore.setData(this.data);

        this.control.addValidators(this.data.validationFns ?? []);
    }

    public onClose(): void {
        this.dialogRef.close();
    }

    public onSave(): void {
        this.dialogRef.close(this.localStore.value());
    }
}
