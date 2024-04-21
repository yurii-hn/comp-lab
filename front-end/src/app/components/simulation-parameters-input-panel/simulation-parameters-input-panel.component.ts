import { Component } from '@angular/core';
import {
    ControlValueAccessor,
    FormControl,
    FormGroup,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator,
    Validators,
} from '@angular/forms';
import { ISimulationParameters } from '@core/types/processing';

type OnChangeFn = (value: ISimulationParameters) => void;
type OnTouchedFn = (value: ISimulationParameters) => void;

@Component({
    selector: 'app-simulation-parameters-input-panel',
    templateUrl: './simulation-parameters-input-panel.component.html',
    styleUrls: ['./simulation-parameters-input-panel.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: SimulationParametersInputPanelComponent,
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: SimulationParametersInputPanelComponent,
            multi: true,
        },
    ],
})
export class SimulationParametersInputPanelComponent
    implements ControlValueAccessor, Validator
{
    public readonly formGroup: FormGroup = new FormGroup({
        time: new FormControl<number | null>(null, [Validators.required]),
        nodesAmount: new FormControl<number | null>(null, [
            Validators.required,
        ]),
    });

    public writeValue(value: ISimulationParameters | undefined): void {
        if (!value) {
            return;
        }

        this.formGroup.setValue(value);
    }

    public registerOnChange(onChange: OnChangeFn): void {
        this.formGroup.valueChanges.subscribe(onChange);
    }

    public registerOnTouched(onTouched: OnTouchedFn): void {
        this.formGroup.valueChanges.subscribe(onTouched);
    }

    public setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.formGroup.disable();
        } else {
            this.formGroup.enable();
        }
    }

    public validate(): ValidationErrors | null {
        return this.formGroup.valid ? null : { simulationParameters: true };
    }
}
