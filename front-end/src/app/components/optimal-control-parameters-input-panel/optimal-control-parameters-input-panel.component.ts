import { Component } from '@angular/core';
import {
    AsyncValidator,
    ControlValueAccessor,
    FormControl,
    FormControlStatus,
    FormGroup,
    NG_ASYNC_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { IOptimalControlParameters, InterventionApproximationType } from '@core/types/processing';
import { Observable, first, map } from 'rxjs';

type OnChangeFn = (value: IOptimalControlParameters) => void;
type OnTouchedFn = (value: IOptimalControlParameters) => void;

@Component({
    selector: 'app-optimal-control-parameters-input-panel',
    templateUrl: './optimal-control-parameters-input-panel.component.html',
    styleUrls: ['./optimal-control-parameters-input-panel.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: OptimalControlParametersInputPanelComponent,
            multi: true,
        },
        {
            provide: NG_ASYNC_VALIDATORS,
            useExisting: OptimalControlParametersInputPanelComponent,
            multi: true,
        },
    ],
})
export class OptimalControlParametersInputPanelComponent
    implements ControlValueAccessor, AsyncValidator
{
    public readonly approximationTypes: {
        text: string;
        value: InterventionApproximationType;
    }[] = [
        {
            text: 'Piecewise constant',
            value: InterventionApproximationType.PiecewiseConstant,
        },
        {
            text: 'Piecewise linear',
            value: InterventionApproximationType.PiecewiseLinear,
        },
    ];

    public readonly formGroup: FormGroup = new FormGroup({
        time: new FormControl<number | null>(null, [Validators.required]),
        nodesAmount: new FormControl<number | null>(null, [
            Validators.required,
        ]),
        costFunction: new FormControl<string | null>(null, [
            Validators.required,
        ]),
        interventionNodesAmount: new FormControl<number | null>(null, [
            Validators.required,
        ]),
        interventionUpperBoundary: new FormControl<number | null>(null, [
            Validators.required,
        ]),
        interventionLowerBoundary: new FormControl<number | null>(null, [
            Validators.required,
        ]),
        interventionApproximationType:
            new FormControl<InterventionApproximationType | null>(
                this.approximationTypes[0].value,
                [Validators.required]
            ),
    });

    public writeValue(value: IOptimalControlParameters | null): void {
        if (!value) {
            this.formGroup.setValue({
                time: null,
                nodesAmount: null,
                costFunction: null,
                interventionNodesAmount: null,
                interventionUpperBoundary: null,
                interventionLowerBoundary: null,
                interventionApproximationType: null,
            });

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

    public validate(): Observable<ValidationErrors | null> {
        return this.formGroup.statusChanges.pipe(
            first((status: FormControlStatus) => status !== 'PENDING'),
            map((status: FormControlStatus) =>
                status === 'VALID'
                    ? null
                    : {
                          optimalControlParameters: true,
                      }
            )
        );
    }
}
