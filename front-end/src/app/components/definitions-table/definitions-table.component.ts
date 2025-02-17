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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Compartment, Constant, Intervention } from '@core/types/model.types';
import { Store } from '@ngrx/store';
import { skip } from 'rxjs';
import {
  CompartmentDefinition,
  ConstantDefinition,
  DefinitionsTableStore,
  FormValue,
  InterventionDefinition,
} from 'src/app/components/definitions-table/definitions-table.store';
import { DatatableComponent } from 'src/app/components/shared/datatable/datatable.component';
import { RowScheme } from 'src/app/components/shared/datatable/datatable.store';
import { DefinitionsTableActions } from 'src/app/state/actions/definitions-table.actions';
import { selectCurrentModel } from 'src/app/state/selectors/workspace.selectors';

@Component({
    selector: 'app-definitions-table',
    imports: [
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        DatatableComponent,
    ],
    providers: [DefinitionsTableStore],
    templateUrl: './definitions-table.component.html',
    styleUrls: ['./definitions-table.component.scss'],
})
export class DefinitionsTableComponent implements OnInit {
    private readonly injector: Injector = inject(Injector);
    private readonly store: Store = inject(Store);
    private readonly localStore = inject(DefinitionsTableStore);
    private readonly dialogRef: MatDialogRef<DefinitionsTableComponent, void> =
        inject(MatDialogRef<DefinitionsTableComponent, void>);

    public readonly control: FormGroup = new FormGroup({
        compartments: new FormControl<(Compartment | CompartmentDefinition)[]>(
            [],
        ),
        constants: new FormControl<(Constant | ConstantDefinition)[]>([]),
        interventions: new FormControl<
            (Intervention | InterventionDefinition)[]
        >([]),
    });

    public readonly compartmentsRowScheme: Signal<
        RowScheme<CompartmentDefinition>
    > = this.localStore.compartmentsRowScheme;
    public readonly constantsRowScheme: Signal<RowScheme<ConstantDefinition>> =
        this.localStore.constantsRowScheme;
    public readonly interventionsRowScheme: Signal<
        RowScheme<InterventionDefinition>
    > = this.localStore.interventionsRowScheme;

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

        this.localStore.setValueFromParent(
            this.store.selectSignal(selectCurrentModel)(),
        );
    }

    public onClose(): void {
        this.dialogRef.close();
    }

    public onSave(): void {
        this.store.dispatch(
            DefinitionsTableActions.updateDefinitions({
                definitions: this.localStore.value(),
            }),
        );

        this.dialogRef.close();
    }
}
