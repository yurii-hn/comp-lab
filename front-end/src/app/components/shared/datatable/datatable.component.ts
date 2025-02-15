import { DecimalPipe, TitleCasePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  effect,
  inject,
  Injector,
  input,
  InputSignal,
  OnInit,
  Signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  ValidatorFn,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTable, MatTableModule } from '@angular/material/table';
import { OnChangeFn, OnTouchedFn } from '@core/types/util.types';
import {
  ColumnScheme,
  DatatableStore,
  Option,
  RowScheme,
  SingularFormValue,
  Value,
} from 'src/app/components/shared/datatable/datatable.store';

@Component({
    selector: 'app-datatable',
    imports: [
        ReactiveFormsModule,
        MatIconModule,
        MatSelectModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        DecimalPipe,
        TitleCasePipe,
    ],
    providers: [
        DatatableStore,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: DatatableComponent,
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: DatatableComponent,
            multi: true,
        },
    ],
    templateUrl: './datatable.component.html',
    styleUrls: ['./datatable.component.scss'],
    host: {
        'class.compact': 'localStore.compact()',
    },
})
export class DatatableComponent
    implements ControlValueAccessor, Validator, OnInit, AfterViewInit
{
    private readonly injector: Injector = inject(Injector);
    private readonly localStore = inject(DatatableStore);

    private onChange: OnChangeFn | null = null;
    private onTouched: OnTouchedFn | null = null;

    private readonly table: Signal<MatTable<SingularFormValue>> =
        viewChild.required<MatTable<SingularFormValue>>(MatTable);

    public readonly rowSchemeInput: InputSignal<RowScheme> = input.required({
        alias: 'rowScheme',
    });
    public readonly rowValidatorsInput: InputSignal<ValidatorFn[]> = input<
        ValidatorFn[]
    >([], {
        alias: 'rowValidators',
    });
    public readonly dataInput: InputSignal<Value | undefined> = input<
        Value | undefined
    >(undefined, {
        alias: 'data',
    });
    public readonly disabledInput: InputSignal<boolean> = input(false, {
        alias: 'disabled',
    });
    public readonly enumerateInput: InputSignal<boolean> = input(false, {
        alias: 'enumerate',
    });
    public readonly compactInput: InputSignal<boolean> = input(false, {
        alias: 'compact',
    });
    public readonly showEmptyColumnsInput: InputSignal<boolean> = input(false, {
        alias: 'showEmptyColumns',
    });

    public control: FormGroup = new FormGroup({});

    public readonly rowScheme: Signal<RowScheme> = this.localStore.rowScheme;
    public readonly rows: Signal<SingularFormValue[]> = this.localStore.rows;

    public readonly columns: Signal<string[]> = this.localStore.columns;
    public readonly ids: Signal<string[]> = this.localStore.ids;
    public readonly editable: Signal<boolean> = this.localStore.editable;
    public readonly maxRows: Signal<number> = this.localStore.maxRows;
    public readonly editing: Signal<boolean> = this.localStore.editing;
    public readonly adding: Signal<boolean> = this.localStore.adding;

    public ngOnInit(): void {
        this.initInputsSync();
        this.initControlSync();
    }

    public ngAfterViewInit(): void {
        this.initTableSync();
    }

    public writeValue(value: Value | null): void {
        this.localStore.markAsReactive();

        this.localStore.setData(value);
    }

    public registerOnChange(onChange: OnChangeFn<Value>): void {
        this.onChange = onChange;
    }

    public registerOnTouched(onTouched: OnTouchedFn): void {
        this.onTouched = onTouched;
    }

    public setDisabledState(disabled: boolean): void {
        this.localStore.setDisabled(disabled);
    }

    public validate(): ValidationErrors | null {
        if (!this.localStore.editing()) {
            return null;
        }

        return {
            unsavedChanges: true,
        };
    }

    public getOptionLabel(columnId: string, value: string): string {
        return this.localStore.getOptionLabel(columnId, value);
    }

    public getAvailableOptions(columnId: string): Option[] {
        return this.localStore.getAvailableOptions(columnId);
    }

    public getErrors(columnId: string): string[] {
        const control: FormControl = this.control.get(columnId) as FormControl;

        const errors: ValidationErrors | null = control.errors;

        return errors ? Object.keys(errors) : [];
    }

    public onEdit(index: number): void {
        this.localStore.editRow(index);
    }

    public onDelete(index: number): void {
        this.localStore.deleteRow(index);
    }

    public onSave(): void {
        this.localStore.saveRow(this.control.value);
    }

    public onCancel(): void {
        this.localStore.cancel();
    }

    public onRowAdd(): void {
        this.localStore.addRow();
    }

    private initInputsSync(): void {
        effect(
            (): void => {
                const rowScheme: RowScheme = this.rowSchemeInput();

                untracked((): void => this.localStore.setRowScheme(rowScheme));
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                const rowValidators: ValidatorFn[] = this.rowValidatorsInput();

                untracked((): void =>
                    this.localStore.setRowValidators(rowValidators),
                );
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                const isReactive: boolean = untracked((): boolean =>
                    this.localStore.isReactive(),
                );

                if (isReactive) {
                    return;
                }

                const data: Value | undefined = this.dataInput();

                untracked((): void => this.localStore.setData(data ?? null));
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                const isReactive: boolean = untracked((): boolean =>
                    this.localStore.isReactive(),
                );

                if (isReactive) {
                    return;
                }

                const disabled: boolean = this.disabledInput();

                untracked((): void => this.localStore.setDisabled(disabled));
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                const enumerate: boolean = this.enumerateInput();

                untracked((): void => this.localStore.setEnumerate(enumerate));
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                const compact: boolean = this.compactInput();

                untracked((): void => this.localStore.setCompact(compact));
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                const showEmptyColumns: boolean = this.showEmptyColumnsInput();

                untracked((): void =>
                    this.localStore.setShowEmptyColumns(showEmptyColumns),
                );
            },
            {
                injector: this.injector,
            },
        );
    }

    private initControlSync(): void {
        effect(
            (): void => {
                const schemesIds: string[] = this.localStore.ids();
                const rowScheme: RowScheme = this.localStore.rowScheme();

                untracked((): void => {
                    this.control = new FormGroup({});

                    schemesIds.forEach((id: string): void => {
                        const scheme: ColumnScheme = rowScheme[
                            id
                        ] as ColumnScheme;

                        const columnControl: FormControl = new FormControl(
                            null,
                            scheme.validationFns || [],
                        );

                        if (!scheme.editable) {
                            columnControl.disable();
                        }

                        this.control.addControl(id, columnControl);
                    });

                    this.setControlValidators(this.localStore.rowValidators());
                });
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                const rowValidators: ValidatorFn[] =
                    this.localStore.rowValidators();

                untracked((): void => this.setControlValidators(rowValidators));
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                const editedRow: SingularFormValue | null =
                    this.localStore.editedRow();

                untracked((): void => {
                    if (!editedRow) {
                        this.control.reset();

                        return;
                    }

                    this.control.patchValue(editedRow.data);
                });
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                if (this.localStore.adding() || this.localStore.editing()) {
                    return;
                }

                const value: Value = this.localStore.value();

                untracked((): void => {
                    if (!this.onChange) {
                        return;
                    }

                    this.onChange(value);
                });
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                this.localStore.editing();
                this.localStore.value();

                untracked((): void => {
                    if (!this.onTouched) {
                        return;
                    }

                    this.onTouched();
                });
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                const rowScheme: RowScheme = this.localStore.rowScheme();
                const ids: string[] = this.localStore.ids();
                const toDisable: boolean = !this.localStore.adding();

                untracked((): void => {
                    ids.forEach((id: string): void => {
                        if (rowScheme[id]!.editable) {
                            return;
                        }

                        const control: FormControl = this.control.get(
                            id,
                        ) as FormControl;

                        if (toDisable) {
                            control.disable();

                            return;
                        }

                        control.enable();
                    });
                });
            },
            {
                injector: this.injector,
            },
        );
    }

    private initTableSync(): void {
        effect(
            (): void => {
                this.localStore.rows();

                untracked((): void => this.table().renderRows());
            },
            {
                injector: this.injector,
            },
        );
    }

    private setControlValidators(validators: ValidatorFn[]): void {
        this.control.clearValidators();
        this.control.setValidators(validators);
        this.control.updateValueAndValidity();
    }
}
