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
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OnChangeFn, OnTouchedFn } from '@core/types/util.types';
import { skip } from 'rxjs';
import {
  FormValue,
  SimulationParametersInputStore,
  Value,
} from 'src/app/components/processing/simulation-parameters-input/simulation-parameters-input.store';

@Component({
    selector: 'app-simulation-parameters-input',
    imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
    providers: [
        SimulationParametersInputStore,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: SimulationParametersInputComponent,
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: SimulationParametersInputComponent,
            multi: true,
        },
    ],
    templateUrl: './simulation-parameters-input.component.html',
    styleUrls: ['./simulation-parameters-input.component.scss'],
})
export class SimulationParametersInputComponent
    implements ControlValueAccessor, Validator, OnInit
{
    private readonly injector: Injector = inject(Injector);
    private readonly localStore = inject(SimulationParametersInputStore);

    private onChange: OnChangeFn | null = null;
    private onTouched: OnTouchedFn | null = null;

    public readonly control: FormGroup = new FormGroup({
        time: new FormControl<number | null>(null, [
            Validators.required,
            Validators.min(0 + Number.EPSILON),
        ]),
        nodesAmount: new FormControl<number | null>(null, [
            Validators.required,
            Validators.min(1),
        ]),
    });

    public ngOnInit(): void {
        const valueChanges: Signal<FormValue | undefined> = toSignal(
            this.control.valueChanges.pipe(skip(1)),
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
        return this.control.valid ? null : { simulation: true };
    }
}
