import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    Output,
    ViewChild,
} from '@angular/core';
import {
    ControlValueAccessor,
    FormControl,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import {
    Subscription,
    debounceTime,
    distinctUntilChanged,
    filter,
    switchMap,
    tap,
} from 'rxjs';
import {
    IDefinitionsTable,
    IValidationResponse,
} from 'src/app/core/interfaces';
import { ModelService } from 'src/app/services/model.service';
import { ValidationService } from 'src/app/services/validation.service';

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
    ],
})
export class EquationInputComponent
    implements ControlValueAccessor, AfterViewInit, OnDestroy
{
    @Input() public title: string = '';
    @Input() public placeholder: string = '';

    @Output()
    public readonly errorsChange: EventEmitter<ValidationErrors | null> =
        new EventEmitter<ValidationErrors | null>();

    public readonly equationFormControl: FormControl = new FormControl(null, [
        Validators.required,
    ]);

    private onChange: () => void = () => {};

    public readonly definitionsTable: IDefinitionsTable;

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
        const validationSubscription: Subscription =
            this.equationFormControl.valueChanges
                .pipe(
                    distinctUntilChanged(),
                    filter((value: string) => !!value),
                    tap(() => {
                        this.errorsChange.emit({});
                    }),
                    debounceTime(500),
                    switchMap((value: string) => {
                        const allowedSymbols: string[] =
                            this.modelService.getAvailableSymbols();

                        return this.validationService.validateEquation(
                            value,
                            allowedSymbols
                        );
                    }),
                    tap((validationResponse: IValidationResponse) => {
                        if (!validationResponse.isValid) {
                            this.equationFormControl.setErrors({
                                equation: {
                                    invalid: validationResponse.message,
                                },
                            });

                            this.errorsChange.emit(
                                this.equationFormControl.errors
                            );
                        } else {
                            this.equationFormControl.setErrors(null);

                            this.errorsChange.emit(null);
                        }
                    })
                )
                .subscribe();

        this.setCursorPosition(inputLength);

        this.subscription.add(validationSubscription);
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public onChipInput(definitionName: string): void {
        const equationValue: string = this.equationFormControl.value;
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

    public writeValue(equation: any): void {
        this.equationFormControl.setValue(equation);
    }

    public registerOnChange(onChange: any): void {
        this.onChange = onChange;

        this.equationFormControl.valueChanges.subscribe(onChange);
    }

    public registerOnTouched(onTouched: any): void {
        this.equationFormControl.valueChanges.subscribe(onTouched);
    }

    public setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.equationFormControl.disable();
        } else {
            this.equationFormControl.enable();
        }
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
