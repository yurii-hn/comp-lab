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
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { OnChangeFn, OnTouchedFn } from '@core/types/util.types';
import { skip } from 'rxjs';
import {
  FormValue,
  PIParametersInputStore,
  SelectedConstantDefinition,
  Value,
} from 'src/app/components/processing/parameters-identification-parameters-input/parameters-identification-parameters-input.store';
import { DatatableComponent } from 'src/app/components/shared/datatable/datatable.component';
import { RowScheme } from 'src/app/components/shared/datatable/datatable.store';

@Component({
    selector: 'app-parameters-identification-parameters-input',
    imports: [
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        DatatableComponent,
    ],
    providers: [
        PIParametersInputStore,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: ParametersIdentificationParametersInputComponent,
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: ParametersIdentificationParametersInputComponent,
            multi: true,
        },
    ],
    templateUrl: './parameters-identification-parameters-input.component.html',
    styleUrls: ['./parameters-identification-parameters-input.component.scss'],
})
export class ParametersIdentificationParametersInputComponent
    implements ControlValueAccessor, Validator, OnInit
{
    private readonly injector: Injector = inject(Injector);
    private readonly localStore = inject(PIParametersInputStore);

    public readonly control: FormGroup = new FormGroup({
        nodesAmount: new FormControl<number | null>(null, [
            Validators.required,
            Validators.min(1),
        ]),
        selectedConstants: new FormControl<SelectedConstantDefinition[] | null>(
            null,
            [Validators.required],
        ),
        data: new FormControl<Record<string, number>[] | null>(null, [
            Validators.required,
        ]),
    });

    public readonly constantsRowScheme: Signal<
        RowScheme<SelectedConstantDefinition>
    > = this.localStore.constantsRowScheme;
    public readonly dataRowScheme: Signal<RowScheme> =
        this.localStore.dataRowScheme;
    public readonly dataRowValidators: Signal<ValidatorFn[]> =
        this.localStore.dataRowValidators;

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
    }

    public writeValue(value: Value | null): void {
        this.localStore.setValueFromParent(value);
    }

    public registerOnChange(onChange: OnChangeFn<Value>): void {
        effect(
            (): void => {
                const value: Value = this.localStore.value();

                untracked((): void => onChange(value));
            },
            {
                injector: this.injector,
            },
        );
    }

    public registerOnTouched(onTouched: OnTouchedFn): void {
        effect(
            (): void => {
                this.localStore.value();

                untracked((): void => onTouched());
            },
            {
                injector: this.injector,
            },
        );
    }

    public setDisabledState(disabled: boolean): void {
        if (disabled) {
            this.control.disable();

            return;
        }

        this.control.enable();
    }

    public validate(): ValidationErrors | null {
        return this.control.valid ? null : { parametersIdentification: true };
    }

    public onDataImport(): void {
        this.localStore.importData();
    }
}
