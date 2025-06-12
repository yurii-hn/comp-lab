import { computed, inject, Signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Compartment, Constant } from '@core/types/model.types';
import { Data, SelectedConstant } from '@core/types/processing';
import { areEqual, datasetToRowData, rowDataToDataset } from '@core/utils';
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
import { Observable, pipe, switchMap, tap } from 'rxjs';
import {
  InputType,
  Option,
  RowScheme,
} from 'src/app/components/shared/datatable/datatable.store';
import { FilesService } from 'src/app/services/files.service';
import { SnackBarService } from 'src/app/services/snack-bar.service';
import {
  selectCompartments,
  selectConstants,
} from 'src/app/state/selectors/workspace.selectors';

export type SelectedConstantDefinition = SelectedConstant & {
    name: string;
};

export interface Value {
    nodesAmount: number | null;
    forecastTime: number;
    selectedConstants: Record<string, SelectedConstant> | null;
    data: Record<string, Data> | null;
}

export interface FormValue {
    nodesAmount: number | null;
    forecastTime: number | null;
    selectedConstants: SelectedConstantDefinition[] | null;
    data: Record<string, number>[] | null;
}

export interface State {
    forecastEnabled: boolean;
    _value: FormValue;
}

const initialState: State = {
    forecastEnabled: false,
    _value: {
        nodesAmount: null,
        forecastTime: 0,
        selectedConstants: null,
        data: null,
    },
};

export const PIParametersInputStore = signalStore(
    withState(initialState),
    withProps(() => {
        const globalStore: Store = inject(Store);

        const filesService: FilesService = inject(FilesService);
        const snackBarService: SnackBarService = inject(SnackBarService);

        const compartments: Signal<Compartment[]> =
            globalStore.selectSignal(selectCompartments);
        const constants: Signal<Constant[]> =
            globalStore.selectSignal(selectConstants);

        return {
            _filesService: filesService,
            _snackBarService: snackBarService,
            _compartments: compartments,
            _constants: constants,
        };
    }),
    withComputed((store) => {
        const value: Signal<Value> = computed(
            (): Value => {
                const parameters: FormValue = formValue();

                const nodesAmount: number | null = parameters.nodesAmount;
                const forecastTime: number = parameters.forecastTime ?? 0;
                const selectedConstants: Value['selectedConstants'] | null =
                    parameters.selectedConstants &&
                    parameters.selectedConstants.reduce(
                        (
                            constants: Record<string, SelectedConstant>,
                            constant: SelectedConstantDefinition
                        ): Record<string, SelectedConstant> => ({
                            ...constants,
                            [constant.name]: {
                                lowerBoundary: constant.lowerBoundary,
                                value: constant.value,
                                upperBoundary: constant.upperBoundary,
                            },
                        }),
                        {}
                    );
                const data: Value['data'] | null =
                    parameters.data && rowDataToDataset(parameters.data);

                return {
                    nodesAmount,
                    forecastTime,
                    selectedConstants,
                    data,
                };
            },
            {
                equal: areEqual,
            }
        );
        const formValue: Signal<FormValue> = computed(
            (): FormValue => store._value(),
            {
                equal: areEqual,
            }
        );

        const constantsRowScheme: Signal<
            RowScheme<SelectedConstantDefinition>
        > = computed(
            (): RowScheme<SelectedConstantDefinition> => ({
                name: {
                    name: 'Name',
                    type: InputType.Select,
                    exclusive: true,
                    options: store._constants().map(
                        (constant: Constant): Option => ({
                            value: constant.name,
                            label: constant.name,
                        })
                    ),
                    validationFns: [Validators.required],
                },
                lowerBoundary: {
                    name: 'Lower boundary',
                    type: InputType.Number,
                    validationFns: [Validators.required],
                    editable: true,
                },
                value: {
                    name: 'Initial guess',
                    type: InputType.Number,
                    validationFns: [Validators.required],
                    editable: true,
                },
                upperBoundary: {
                    name: 'Upper boundary',
                    type: InputType.Number,
                    validationFns: [Validators.required],
                    editable: true,
                },
            })
        );

        const dataRowScheme: Signal<RowScheme> = computed(
            (): RowScheme =>
                [
                    ...store._compartments().map(
                        (compartment: Compartment): RowScheme => ({
                            [compartment.name]: {
                                name: compartment.name,
                                editable: true,
                                type: InputType.Number,
                                validationFns: [Validators.min(0)],
                            },
                        })
                    ),
                ].reduce(
                    (
                        rowScheme: RowScheme,
                        columnScheme: RowScheme
                    ): RowScheme => ({
                        ...rowScheme,
                        ...columnScheme,
                    }),
                    {
                        t: {
                            name: 'Time',
                            type: InputType.Number,
                            validationFns: [
                                Validators.required,
                                Validators.min(0),
                            ],
                        },
                    }
                )
        );
        const dataRowValidators: Signal<ValidatorFn[]> = computed(
            (): ValidatorFn[] => [dataRow()]
        );

        return {
            value,
            formValue,

            constantsRowScheme,
            dataRowScheme,
            dataRowValidators,
        };
    }),
    withMethods((store) => {
        const setForecastModeState = (enabled: boolean): void =>
            patchState(store, {
                forecastEnabled: enabled,
            });
        const setValueFromParent = (value: Value | null): void =>
            patchState(store, {
                _value: {
                    nodesAmount: value && value.nodesAmount,
                    forecastTime: value ? value.forecastTime : 0,
                    selectedConstants:
                        value &&
                        value?.selectedConstants &&
                        Object.entries(value.selectedConstants).map(
                            ([name, constant]: [
                                string,
                                SelectedConstant
                            ]): SelectedConstantDefinition => ({
                                name,
                                ...constant,
                            })
                        ),
                    data: value && value?.data && datasetToRowData(value.data),
                },
                forecastEnabled:
                    value?.forecastTime !== null &&
                    value?.forecastTime !== undefined,
            });
        const setValueFromForm = (value: FormValue): void =>
            patchState(store, { _value: value });
        const importData = rxMethod<void>(
            pipe(
                switchMap(
                    (): Observable<Record<string, Data>> =>
                        store._filesService.readDataFromFile<
                            Record<string, Data>
                        >('.scs')
                ),
                tap((data: Record<string, Data>): void =>
                    patchState(store, {
                        _value: {
                            ...store._value(),
                            data: datasetToRowData(data),
                        },
                    })
                ),
                tap((): void =>
                    store._snackBarService.open(
                        'Imported successfully',
                        'Dismiss',
                        {
                            panelClass: 'snackbar',
                            horizontalPosition: 'right',
                            verticalPosition: 'bottom',
                            duration: 5000,
                        }
                    )
                )
            )
        );

        return {
            setForecastModeState,
            setValueFromParent,
            setValueFromForm,
            importData,
        };
    })
);

function dataRow(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const timeControl: FormControl<number> = (control as FormGroup)
            .controls['t'] as FormControl<number>;
        const value: Record<string, number> = structuredClone(control.value);

        if (timeControl.enabled && !value['t']) {
            return { missingTime: true };
        }

        delete value['t'];

        return Object.values(value).some((value: number): boolean => {
            if (!value) {
                return false;
            }

            return true;
        })
            ? null
            : { missingValues: true };
    };
}
