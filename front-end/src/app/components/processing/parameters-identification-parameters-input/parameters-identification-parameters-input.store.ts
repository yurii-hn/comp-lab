import { computed, inject, Signal } from '@angular/core';
import { ValidatorFn, Validators } from '@angular/forms';
import { Compartment, Constant, Intervention } from '@core/types/model.types';
import { SelectedConstant, Values } from '@core/types/processing';
import { areEqual, rowDataToValues, valuesToRowData } from '@core/utils';
import { dataRow } from '@core/validators';
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
  selectInterventions,
} from 'src/app/state/selectors/workspace.selectors';

export type SelectedConstantDefinition = Omit<SelectedConstant, 'id'>;

export interface Value {
    nodesAmount: number | null;
    selectedConstants: SelectedConstant[] | null;
    data: Values[] | null;
}

export interface FormValue {
    nodesAmount: number | null;
    selectedConstants: SelectedConstantDefinition[] | null;
    data: Record<string, number>[] | null;
}

const initialValue: FormValue = {
    nodesAmount: null,
    selectedConstants: null,
    data: null,
};

export const PIParametersInputStore = signalStore(
    withState(initialValue),
    withProps(() => {
        const globalStore: Store = inject(Store);

        const filesService: FilesService = inject(FilesService);
        const snackBarService: SnackBarService = inject(SnackBarService);

        const compartments: Signal<Compartment[]> =
            globalStore.selectSignal(selectCompartments);
        const constants: Signal<Constant[]> =
            globalStore.selectSignal(selectConstants);
        const interventions: Signal<Intervention[]> =
            globalStore.selectSignal(selectInterventions);

        return {
            _filesService: filesService,
            _snackBarService: snackBarService,
            _compartments: compartments,
            _constants: constants,
            _interventions: interventions,
        };
    }),
    withComputed((store) => {
        const value: Signal<Value> = computed(
            (): Value => {
                const parameters: FormValue = formValue();

                const nodesAmount: number | null = parameters.nodesAmount;
                const selectedConstants: SelectedConstant[] | null =
                    parameters.selectedConstants &&
                    parameters.selectedConstants.map(
                        (
                            selectedConstant: SelectedConstantDefinition,
                        ): SelectedConstant => ({
                            ...selectedConstant,
                            id: store
                                ._constants()
                                .find(
                                    (constant: Constant): boolean =>
                                        constant.name === selectedConstant.name,
                                )!.id,
                        }),
                    );
                const data: Values[] | null =
                    parameters.data && rowDataToValues(parameters.data);

                return {
                    nodesAmount,
                    selectedConstants,
                    data,
                };
            },
            {
                equal: areEqual,
            },
        );
        const formValue: Signal<FormValue> = computed(
            (): FormValue => ({
                nodesAmount: store.nodesAmount(),
                selectedConstants: store.selectedConstants(),
                data: store.data(),
            }),
            {
                equal: areEqual,
            },
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
                        }),
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
            }),
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
                        }),
                    ),
                    ...store._interventions().map(
                        (intervention: Intervention): RowScheme => ({
                            [intervention.name]: {
                                name: intervention.name,
                                editable: true,
                                type: InputType.Number,
                                validationFns: [Validators.required],
                            },
                        }),
                    ),
                ].reduce(
                    (
                        rowScheme: RowScheme,
                        columnScheme: RowScheme,
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
                    },
                ),
        );
        const dataRowValidators: Signal<ValidatorFn[]> = computed(
            (): ValidatorFn[] => [dataRow()],
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
        const setValueFromParent = (value: Value | null): void =>
            patchState(store, {
                nodesAmount: value && value.nodesAmount,
                selectedConstants: value && value.selectedConstants,
                data: value && value.data && valuesToRowData(value.data),
            });
        const setValueFromForm = (value: FormValue): void =>
            patchState(store, value);
        const importData = rxMethod<void>(
            pipe(
                switchMap(
                    (): Observable<Values[]> =>
                        store._filesService.readDataFromFile<Values[]>('.scs'),
                ),
                tap((data: Values[]): void =>
                    patchState(store, {
                        data: valuesToRowData(data),
                    }),
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
                        },
                    ),
                ),
            ),
        );

        return {
            setValueFromParent,
            setValueFromForm,
            importData,
        };
    }),
);
