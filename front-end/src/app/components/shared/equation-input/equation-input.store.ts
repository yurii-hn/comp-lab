import { computed, inject, Signal } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import {
 patchState,
 signalStore,
 withComputed,
 withMethods,
 withProps,
 withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Store } from '@ngrx/store';
import {
 combineLatestWith,
 debounceTime,
 distinctUntilChanged,
 filter,
 Observable,
 pipe,
 Subject,
 switchMap,
 tap,
} from 'rxjs';
import {
 ValidationResponse,
 ValidationService,
} from 'src/app/services/validation.service';
import { selectSymbols } from 'src/app/state/selectors/workspace.selectors';

export type Value = string;

export type FormValue = string;

export interface State {
    title: string;
    placeholder: string;
    equation: FormValue;
}

const initialState: State = {
    title: '',
    placeholder: '',
    equation: '',
};

export const EquationInputStore = signalStore(
    withState(initialState),
    withProps(() => {
        const globalStore: Store = inject(Store);
        const validationService: ValidationService = inject(ValidationService);

        const validationResult: Subject<ValidationErrors | null> =
            new Subject<ValidationErrors | null>();

        return {
            _globalStore: globalStore,
            _validationService: validationService,
            validationResult,
        };
    }),
    withComputed((store) => {
        const value: Signal<Value> = computed((): Value => formValue());
        const formValue: Signal<FormValue> = computed(
            (): FormValue => store.equation()
        );

        return {
            value,
            formValue,
        };
    }),
    withMethods((store) => {
        const setTitle = (title: string): void =>
            patchState(store, {
                title,
            });
        const setPlaceholder = (placeholder: string): void =>
            patchState(store, {
                placeholder,
            });
        const setValueFromParent = (value: Value | null): void =>
            patchState(store, {
                equation: value ?? '',
            });
        const setValueFromForm = (value: FormValue | null): void =>
            patchState(store, {
                equation: value ?? '',
            });

        const insertAt = (value: string, position: number): number => {
            const equation: string | null = store.equation();

            if (equation === null) {
                return Infinity;
            }

            const leftPart: string = equation
                ? equation.slice(0, position).trim()
                : '';
            const rightPart: string = equation
                ? equation.slice(position).trim()
                : '';

            const newEquation: string = `${leftPart} ${value} ${rightPart}`;

            patchState(store, {
                equation: newEquation,
            });

            return leftPart.length + value.length + 2;
        };

        const validate = rxMethod<Value | null>(
            pipe(
                filter(
                    (equation: Value | null): equation is Value => !!equation
                ),
                debounceTime(500),
                distinctUntilChanged(),
                combineLatestWith(store._globalStore.select(selectSymbols)),
                switchMap(
                    ([equation, symbols]): Observable<ValidationResponse> =>
                        store._validationService.expression(equation, symbols)
                ),
                tap((response: ValidationResponse): void => {
                    if (!response.valid) {
                        const errors: ValidationErrors = {
                            invalid: response.message,
                        };

                        store.validationResult.next(errors);

                        return;
                    }

                    store.validationResult.next(null);
                })
            )
        );

        return {
            setTitle,
            setPlaceholder,
            setValueFromParent,
            setValueFromForm,

            insertAt,
            validate,
        };
    })
);
