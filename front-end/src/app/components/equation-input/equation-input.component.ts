import {
    AfterViewInit,
    Component,
    ElementRef,
    HostBinding,
    Input,
    OnDestroy,
    ViewChild,
} from '@angular/core';
import {
    AsyncValidator,
    ControlValueAccessor,
    FormControl,
    NG_ASYNC_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { IDefinitionsTable } from '@core/types/definitions';
import { IValidationResponse } from '@core/types/processing';
import {
    Observable,
    Subject,
    Subscription,
    debounceTime,
    distinctUntilChanged,
    filter,
    switchMap,
    take,
    tap,
} from 'rxjs';
import { ModelService } from 'src/app/services/model.service';
import { ValidationService } from 'src/app/services/validation.service';

type OnChangeFn = (value: string | null) => void;
type OnTouchedFn = (value: string | null) => void;

@Component({
    selector: 'app-equation-input',
    templateUrl: './equation-input.component.html',
    styleUrls: ['./equation-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: EquationInputComponent,
            multi: true,
        },
        {
            provide: NG_ASYNC_VALIDATORS,
            useExisting: EquationInputComponent,
            multi: true,
        },
    ],
})
export class EquationInputComponent
    implements ControlValueAccessor, AfterViewInit, OnDestroy, AsyncValidator
{
    @Input() public title: string = '';
    @Input() public placeholder: string = '';

    @HostBinding('class.no-padding')
    @Input()
    public noPadding: boolean = false;

    public readonly equationFormControl: FormControl<string | null> =
        new FormControl<string | null>(null, [Validators.required]);

    public readonly definitionsTable: IDefinitionsTable;

    private readonly validationRequest: Subject<string | null> = new Subject();
    private readonly validationResult: Subject<ValidationErrors | null> =
        new Subject();
    private readonly subscription: Subscription = new Subscription();

    @ViewChild('equationInput') private equationInput!: ElementRef;

    constructor(
        private readonly modelService: ModelService,
        private readonly validationService: ValidationService
    ) {
        this.definitionsTable = this.modelService.getDefinitionsTable();
    }

    public ngAfterViewInit(): void {
        const inputLength: number = this.equationFormControl.value
            ? this.equationFormControl.value.length
            : 0;

        this.setCursorPosition(inputLength);
        this.initValidator();

        this.validationRequest.next(this.equationFormControl.value);
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public onChipInput(definitionName: string): void {
        const equationValue: string | null = this.equationFormControl.value;
        const cursorPosition: number = this.getCursorPosition();

        const leftPart: string = equationValue
            ? equationValue.slice(0, cursorPosition).trim()
            : '';
        const rightPart: string = equationValue
            ? equationValue.slice(cursorPosition).trim()
            : '';

        this.equationFormControl.setValue(
            `${leftPart} ${definitionName} ${rightPart}`
        );

        this.setCursorPosition(leftPart.length + definitionName.length + 2);
    }

    public writeValue(equation: string | null): void {
        this.equationFormControl.setValue(equation);
    }

    public registerOnChange(onChange: OnChangeFn): void {
        this.equationFormControl.valueChanges.subscribe(onChange);
    }

    public registerOnTouched(onTouched: OnTouchedFn): void {
        this.equationFormControl.valueChanges.subscribe(onTouched);
    }

    public setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.equationFormControl.disable();
        } else {
            this.equationFormControl.enable();
        }
    }

    public validate(): Observable<ValidationErrors | null> {
        this.validationRequest.next(this.equationFormControl.value);

        return this.validationResult.asObservable().pipe(take(1));
    }

    private initValidator(): void {
        const validationSubscription: Subscription = this.validationRequest
            .pipe(
                distinctUntilChanged(),
                filter((value: string | null): value is string =>
                    Boolean(value)
                ),
                debounceTime(500),
                switchMap((value: string) =>
                    this.validationService.validateEquation(
                        value as string,
                        this.modelService.getAvailableSymbols()
                    )
                ),
                tap((validationResponse: IValidationResponse): void => {
                    if (!validationResponse.isValid) {
                        const validationErrors: ValidationErrors = {
                            equation: {
                                invalid: validationResponse.message,
                            },
                        };

                        this.equationFormControl.setErrors(validationErrors);

                        this.validationResult.next(validationErrors);

                        return;
                    }

                    this.equationFormControl.setErrors(null);

                    this.validationResult.next(null);
                })
            )
            .subscribe();

        this.subscription.add(validationSubscription);
    }

    private setCursorPosition(positionIndex: number): void {
        this.equationInput.nativeElement.focus();

        this.equationInput.nativeElement.selectionStart = positionIndex;
        this.equationInput.nativeElement.selectionEnd = positionIndex;
    }

    private getCursorPosition(): number {
        return this.equationInput.nativeElement.selectionStart || 0;
    }
}
