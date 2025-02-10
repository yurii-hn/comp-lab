import { Component, effect, inject, Signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Flow } from '@core/types/model.types';
import { Store } from '@ngrx/store';
import { skip } from 'rxjs';
import {
  FlowDialogStore,
  FormValue,
} from 'src/app/components/graph/flow-dialog/flow-dialog.store';
import { Option } from 'src/app/components/shared/datatable/datatable.store';
import { EquationInputComponent } from 'src/app/components/shared/equation-input/equation-input.component';
import { FlowDialogActions } from 'src/app/state/actions/flow-dialog.actions';

@Component({
    selector: 'app-flow-dialog',
    imports: [
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatSelectModule,
        EquationInputComponent,
    ],
    providers: [FlowDialogStore],
    templateUrl: './flow-dialog.component.html',
    styleUrls: ['./flow-dialog.component.scss'],
})
export class FlowDialogComponent {
    private readonly store: Store = inject(Store);
    private readonly localStore = inject(FlowDialogStore);
    private readonly dialogRef: MatDialogRef<FlowDialogComponent, void> =
        inject(MatDialogRef<FlowDialogComponent, void>);

    public readonly editMode: Signal<boolean> = this.localStore.editMode;
    public readonly sources: Signal<Option[]> = this.localStore.sources;
    public readonly targets: Signal<Option[]> = this.localStore.targets;

    public readonly control: FormGroup = new FormGroup({
        equation: new FormControl<string>('', [Validators.required]),
        source: new FormControl<string>('', [Validators.required]),
        target: new FormControl<string>('', [Validators.required]),
    });

    constructor() {
        const valueChanges: Signal<FormValue | undefined> = toSignal(
            this.control.valueChanges.pipe(skip(1)),
        );
        const initialData: Flow | undefined = inject(MAT_DIALOG_DATA);

        effect((): void => {
            const change: FormValue | undefined = valueChanges();

            if (change === undefined) {
                return;
            }

            untracked((): void => this.localStore.setValueFromForm(change));
        });

        effect(() => {
            const formValue: FormValue = this.localStore.formValue();

            untracked((): void => this.control.patchValue(formValue));
        });

        this.localStore.setInitialData(initialData ?? null);
    }

    public onClose(): void {
        this.dialogRef.close();
    }

    public onAccept(): void {
        this.store.dispatch(
            FlowDialogActions.upsertFlow({
                flow: this.localStore.value(),
            }),
        );

        this.dialogRef.close();
    }
}
