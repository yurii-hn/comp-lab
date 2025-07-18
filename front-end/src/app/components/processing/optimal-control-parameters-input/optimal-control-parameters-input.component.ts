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
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormControlStatus,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  InterpolationType,
  InterventionBoundaries,
} from '@core/types/processing';
import {
  OnChangeFn,
  OnTouchedFn,
  OnValidatorChangeFn,
} from '@core/types/util.types';
import { skip } from 'rxjs';
import {
  FormValue,
  InterventionBoundariesDefinition,
  OptimalControlParametersInputStore,
  Value,
} from 'src/app/components/processing/optimal-control-parameters-input/optimal-control-parameters-input.store';
import { DatatableComponent } from 'src/app/components/shared/datatable/datatable.component';
import { RowScheme } from 'src/app/components/shared/datatable/datatable.store';
import { EquationInputComponent } from 'src/app/components/shared/equation-input/equation-input.component';

interface InterpolationTypeOption {
    text: string;
    value: InterpolationType;
}

@Component({
    selector: 'app-optimal-control-parameters-input',
    imports: [
        ReactiveFormsModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        EquationInputComponent,
        DatatableComponent,
    ],
    providers: [
        OptimalControlParametersInputStore,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: OptimalControlParametersInputComponent,
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: OptimalControlParametersInputComponent,
            multi: true,
        },
    ],
    templateUrl: './optimal-control-parameters-input.component.html',
    styleUrls: ['./optimal-control-parameters-input.component.scss'],
})
export class OptimalControlParametersInputComponent
    implements ControlValueAccessor, Validator, OnInit
{
    private readonly injector: Injector = inject(Injector);
    private readonly localStore = inject(OptimalControlParametersInputStore);

    private onChange: OnChangeFn | null = null;
    private onTouched: OnTouchedFn | null = null;
    private onValidatorChange: OnValidatorChangeFn | null = null;

    public readonly control: FormGroup = new FormGroup({
        time: new FormControl<number | null>(null, [
            Validators.required,
            Validators.min(0 + Number.EPSILON),
        ]),
        nodesAmount: new FormControl<number | null>(null, [
            Validators.required,
            Validators.min(1),
        ]),
        objectiveFunction: new FormControl<string | null>(null, [
            Validators.required,
        ]),
        intervention: new FormGroup({
            nodesAmount: new FormControl<number | null>(null, [
                Validators.required,
            ]),
            interpolationType: new FormControl<InterpolationType | null>(null, [
                Validators.required,
            ]),
            boundaries: new FormControl<
                | InterventionBoundaries[]
                | InterventionBoundariesDefinition[]
                | null
            >(null, [
                Validators.required,
                interventionBoundariesValidator(
                    this.localStore.interventionsNames,
                ),
            ]),
        }),
    });

    public readonly boundariesRowScheme: Signal<
        RowScheme<InterventionBoundariesDefinition>
    > = this.localStore.boundariesRowScheme;

    public readonly interpolationTypes: InterpolationTypeOption[] = [
        {
            text: 'Piecewise constant',
            value: InterpolationType.PiecewiseConstant,
        },
        {
            text: 'Piecewise linear',
            value: InterpolationType.PiecewiseLinear,
        },
    ];

    public ngOnInit(): void {
        const valueChanges: Signal<FormValue | undefined> = toSignal(
            this.control.valueChanges.pipe(skip(1)),
            {
                injector: this.injector,
            },
        );
        const statusChanges: Signal<FormControlStatus | undefined> = toSignal(
            this.control.statusChanges,
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
                const value: Value = this.localStore.value();

                untracked((): void => {
                    if (this.onChange) {
                        this.onChange(value);
                    }

                    if (this.onTouched) {
                        this.onTouched();
                    }
                });
            },
            {
                injector: this.injector,
            },
        );

        effect(
            (): void => {
                const status: FormControlStatus | undefined = statusChanges();

                if (status === undefined) {
                    return;
                }

                untracked((): void => {
                    if (!this.onValidatorChange) {
                        return;
                    }

                    this.onValidatorChange();
                });
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
        this.onChange = onChange;
    }

    public registerOnTouched(onTouched: OnTouchedFn): void {
        this.onTouched = onTouched;
    }

    public setDisabledState(disabled: boolean): void {
        if (disabled) {
            this.control.disable();

            return;
        }

        this.control.enable();
    }

    public validate(): ValidationErrors | null {
        return this.control.valid ? null : { optimalControl: true };
    }

    public registerOnValidatorChange(
        onValidatorChange: OnValidatorChangeFn,
    ): void {
        this.onValidatorChange = onValidatorChange;
    }
}

function interventionBoundariesValidator(
    existingInterventions: Signal<string[]>,
): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const boundaries: InterventionBoundariesDefinition[] | null =
            control.value;

        return existingInterventions().find(
            (intervention: string): boolean =>
                !boundaries?.find(
                    (boundary: InterventionBoundariesDefinition): boolean =>
                        boundary.name === intervention,
                ),
        )
            ? {
                  missingBoundaries: true,
              }
            : null;
    };
}
