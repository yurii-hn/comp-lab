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
  FormControlStatus,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApproximationType } from '@core/types/processing';
import {
  OnChangeFn,
  OnTouchedFn,
  OnValidatorChangeFn,
} from '@core/types/util.types';
import { skip } from 'rxjs';
import {
  FormValue,
  OptimalControlParametersInputStore,
  Value,
} from 'src/app/components/processing/optimal-control-parameters-input/optimal-control-parameters-input.store';
import { EquationInputComponent } from 'src/app/components/shared/equation-input/equation-input.component';

interface ApproximationTypeOption {
    text: string;
    value: ApproximationType;
}

@Component({
    selector: 'app-optimal-control-parameters-input',
    imports: [
        ReactiveFormsModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        EquationInputComponent,
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
            approximationType: new FormControl<ApproximationType | null>(null, [
                Validators.required,
            ]),
            lowerBoundary: new FormControl<number | null>(null, [
                Validators.required,
            ]),
            upperBoundary: new FormControl<number | null>(null, [
                Validators.required,
            ]),
        }),
    });

    public readonly approximationTypes: ApproximationTypeOption[] = [
        {
            text: 'Piecewise constant',
            value: ApproximationType.PiecewiseConstant,
        },
        {
            text: 'Piecewise linear',
            value: ApproximationType.PiecewiseLinear,
        },
    ];

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
        return this.control.valid ? null : { optimalControl: true };
    }

    public registerOnValidatorChange(
        onValidatorChange: OnValidatorChangeFn,
    ): void {
        const statusChanges: Signal<FormControlStatus | undefined> = toSignal(
            this.control.statusChanges,
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

                untracked((): void => onValidatorChange());
            },
            {
                injector: this.injector,
            },
        );
    }
}
