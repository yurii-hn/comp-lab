import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  InputSignal,
  OnInit,
  Signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormControlStatus,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Compartment, Constant, Intervention } from '@core/types/model.types';
import {
  OnChangeFn,
  OnTouchedFn,
  OnValidatorChangeFn,
} from '@core/types/util.types';
import { Store } from '@ngrx/store';
import { Observable, skip, take } from 'rxjs';
import {
  EquationInputStore,
  FormValue,
  Value,
} from 'src/app/components/shared/equation-input/equation-input.store';
import {
  selectCompartments,
  selectConstants,
  selectInterventions,
} from 'src/app/state/selectors/workspace.selectors';

@Component({
    selector: 'app-equation-input',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatChipsModule,
        CdkTextareaAutosize,
        NgTemplateOutlet,
        KeyValuePipe,
    ],
    providers: [
        EquationInputStore,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: EquationInputComponent,
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: EquationInputComponent,
            multi: true,
        },
    ],
    templateUrl: './equation-input.component.html',
    styleUrls: ['./equation-input.component.scss'],
})
export class EquationInputComponent
    implements ControlValueAccessor, AfterViewInit, OnInit, Validator
{
    private readonly injector: Injector = inject(Injector);
    private readonly store: Store = inject(Store);
    private readonly localStore = inject(EquationInputStore);

    private onChange: OnChangeFn | null = null;
    private onTouched: OnTouchedFn | null = null;
    private onValidatorChange: OnValidatorChangeFn | null = null;

    private equationInput: Signal<ElementRef<HTMLTextAreaElement>> =
        viewChild.required<ElementRef<HTMLTextAreaElement>>('input');

    public readonly titleInput: InputSignal<string> = input.required({
        alias: 'title',
    });
    public readonly placeholderInput: InputSignal<string> = input.required({
        alias: 'placeholder',
    });

    public readonly title: Signal<string> = this.localStore.title;
    public readonly placeholder: Signal<string> = this.localStore.placeholder;

    public readonly control: FormControl<string | null> =
        new FormControl<string>(
            '',
            [Validators.required],
            [this.controlValidator.bind(this)],
        );

    public readonly compartments: Signal<Compartment[]> =
        this.store.selectSignal(selectCompartments);
    public readonly constants: Signal<Constant[]> =
        this.store.selectSignal(selectConstants);
    public readonly interventions: Signal<Intervention[]> =
        this.store.selectSignal(selectInterventions);

    public ngOnInit(): void {
        this.initInputsSync();
        this.initControlSync();
    }

    public ngAfterViewInit(): void {
        this.localStore.validate(this.control.value);

        this.setCursorPosition(this.control.value?.length ?? 0);
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
        return this.control.valid ? null : { equation: true };
    }

    public registerOnValidatorChange(
        onValidatorChange: OnValidatorChangeFn,
    ): void {
        this.onValidatorChange = onValidatorChange;
    }

    public onChipInput(name: string): void {
        const newCursorPosition: number = this.localStore.insertAt(
            name,
            this.getCursorPosition(),
        );

        this.setCursorPosition(newCursorPosition);
    }

    private initInputsSync(): void {
        effect(
            (): void => {
                const title: string = this.titleInput();

                untracked((): void => this.localStore.setTitle(title));
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                const placeholder: string = this.placeholderInput();

                untracked((): void =>
                    this.localStore.setPlaceholder(placeholder),
                );
            },
            {
                injector: this.injector,
            },
        );
    }

    private initControlSync(): void {
        const valueChanges: Signal<string | null | undefined> = toSignal(
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
        const validationResult: Signal<ValidationErrors | null | undefined> =
            toSignal(this.localStore.validationResult, {
                injector: this.injector,
            });

        effect(
            () => {
                const formValue: FormValue = this.localStore.formValue();

                untracked((): void => this.control.setValue(formValue));
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                const change: string | null | undefined = valueChanges();

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
            () => {
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
                const result: ValidationErrors | null | undefined =
                    validationResult();

                if (result === undefined) {
                    return;
                }

                untracked((): void => this.control.setErrors(result));
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

    private getCursorPosition(): number {
        return this.equationInput().nativeElement.selectionStart || 0;
    }

    private setCursorPosition(position: number): void {
        const input: HTMLTextAreaElement = this.equationInput().nativeElement;

        input.focus();

        input.selectionStart = position;
        input.selectionEnd = position;
    }

    private controlValidator(
        control: AbstractControl,
    ): Observable<ValidationErrors | null> {
        this.localStore.validate(control.value);

        return this.localStore.validationResult.pipe(take(1));
    }
}
