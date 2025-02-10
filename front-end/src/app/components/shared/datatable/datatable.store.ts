import { computed, Signal } from '@angular/core';
import { ValidatorFn } from '@angular/forms';
import { areEqual } from '@core/utils';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

export interface Row<DataType extends Record<string, any> = any> {
    data: DataType;
    editing: boolean;
}

export interface BaseColumnScheme {
    name: string;
    type: InputType;
    editable?: boolean;
    validationFns?: ValidatorFn[];
}

export interface TextColumnScheme extends BaseColumnScheme {
    type: InputType.Text;
}

export interface NumberColumnScheme extends BaseColumnScheme {
    type: InputType.Number;
}

export interface Option {
    value: string;
    label: string;
}

export interface SelectColumnScheme extends BaseColumnScheme {
    type: InputType.Select;
    exclusive: boolean;
    options: Option[];
}

export type ColumnScheme =
    | TextColumnScheme
    | NumberColumnScheme
    | SelectColumnScheme;

export type RowScheme<ValueType = any> = {
    [Key in Extract<keyof ValueType, string>]?: ColumnScheme;
};

export enum InputType {
    Text = 'text',
    Number = 'number',
    Select = 'select',
}

export type SingularValue = Record<string, unknown>;
export type Value = SingularValue[];

export type SingularFormValue = Row<SingularValue>;
export type FormValue = SingularFormValue[];

export interface State {
    isReactive: boolean;

    rowScheme: RowScheme;
    rowValidators: ValidatorFn[];
    rows: FormValue;
    disabled: boolean;
    enumerate: boolean;
    compact: boolean;

    adding: boolean;
}

const initialState: State = {
    isReactive: false,

    rowScheme: {},
    rowValidators: [],
    rows: [],
    disabled: false,
    enumerate: false,
    compact: false,

    adding: false,
};

export const DatatableStore = signalStore(
    withState(initialState),
    withComputed((store) => {
        const value: Signal<Value> = computed(
            (): Value =>
                store
                    .rows()
                    .map((row: SingularFormValue): SingularValue => row.data),
            {
                equal: areEqual,
            },
        );
        const columns: Signal<string[]> = computed((): string[] => {
            const columns: string[] = [];

            if (store.enumerate()) {
                columns.push('index');
            }

            columns.push(...ids());

            if (!store.compact()) {
                columns.push('placeholder');
            }

            if (!store.disabled()) {
                columns.push('actions');
            }

            return columns;
        });
        const ids: Signal<string[]> = computed((): string[] =>
            Object.keys(store.rowScheme()),
        );
        const editable: Signal<boolean> = computed((): boolean =>
            ids().some(
                (id: string): boolean => !!store.rowScheme()[id]?.editable,
            ),
        );
        const maxRows: Signal<number> = computed((): number => {
            const schemesIds: string[] = ids();
            const rowScheme: RowScheme<SingularValue> = store.rowScheme();

            const optionsCounts: number[] = schemesIds.reduce(
                (counts: number[], id: string): number[] => {
                    const scheme: ColumnScheme = rowScheme[id] as ColumnScheme;

                    if (scheme.type !== InputType.Select || !scheme.exclusive) {
                        return counts;
                    }

                    counts.push(scheme.options.length);

                    return counts;
                },
                [],
            );

            return optionsCounts.length > 0
                ? Math.min(...optionsCounts)
                : Infinity;
        });
        const editing: Signal<boolean> = computed((): boolean =>
            store.rows().some((row: SingularFormValue): boolean => row.editing),
        );
        const editedRow: Signal<SingularFormValue | null> = computed(
            (): SingularFormValue | null =>
                store
                    .rows()
                    .find((row: SingularFormValue): boolean => row.editing) ??
                null,
        );
        const optionsMap: Signal<Record<string, Option[]>> = computed(
            (): Record<string, Option[]> => {
                const schemesIds: string[] = ids();
                const rowScheme: RowScheme = store.rowScheme();
                const rows: FormValue = store.rows();

                const map: Record<string, Option[]> = {};

                schemesIds.forEach((id: string): void => {
                    const scheme: ColumnScheme = rowScheme[id] as ColumnScheme;

                    if (scheme.type !== InputType.Select) {
                        return;
                    }

                    if (!scheme.exclusive) {
                        map[id] = scheme.options;

                        return;
                    }

                    const available: Option[] = scheme.options.filter(
                        (option: Option): boolean =>
                            !rows.some(
                                (row: SingularFormValue): boolean =>
                                    option.value === row.data[id],
                            ),
                    );

                    map[id] = available;
                });

                return map;
            },
        );

        return {
            value,
            columns,
            ids,
            editable,
            maxRows,
            editing,
            editedRow,
            _optionsMap: optionsMap,
        };
    }),
    withMethods((store) => {
        const markAsReactive = (): void =>
            patchState(store, {
                isReactive: true,
            });

        const setRowScheme = (rowScheme: RowScheme): void =>
            patchState(store, {
                rowScheme,
            });
        const setRowValidators = (rowValidators: ValidatorFn[]): void =>
            patchState(store, {
                rowValidators,
            });
        const setData = (value: Value | null): void =>
            patchState(store, {
                rows:
                    value?.map(
                        (data: SingularValue): SingularFormValue => ({
                            data,
                            editing: false,
                        }),
                    ) ?? [],
            });
        const setDisabled = (disabled: boolean): void =>
            patchState(store, {
                disabled,
            });
        const setEnumerate = (enumerate: boolean): void =>
            patchState(store, {
                enumerate,
            });
        const setCompact = (compact: boolean): void =>
            patchState(store, {
                compact,
            });

        const getOptionLabel = (id: string, value: string): string => {
            const scheme: SelectColumnScheme = store.rowScheme()[
                id
            ] as SelectColumnScheme;

            const option: Option = scheme.options.find(
                (option: Option): boolean => option.value === value,
            ) as Option;

            return option.label;
        };

        const getAvailableOptions = (id: string): Option[] =>
            store._optionsMap()[id] ?? [];

        const editRow = (rowIndex: number): void =>
            patchState(store, {
                rows: store.rows().map(
                    (
                        row: SingularFormValue,
                        index: number,
                    ): SingularFormValue => ({
                        ...row,
                        editing: index === rowIndex,
                    }),
                ),
            });

        const deleteRow = (index: number): void =>
            patchState(store, {
                rows: [
                    ...store.rows().slice(0, index),
                    ...store.rows().slice(index + 1),
                ],
            });

        const saveRow = (value: SingularValue): void => {
            const rowScheme: RowScheme = store.rowScheme();

            store.ids().forEach((id: string): void => {
                const scheme: ColumnScheme = rowScheme[id] as ColumnScheme;

                if (!scheme.editable && !store.adding()) {
                    return;
                }

                switch (scheme.type) {
                    case InputType.Number:
                        value[id] = parseFloat(value[id] as string);

                        break;
                }
            });

            patchState(store, {
                rows: store.rows().map(
                    (row: SingularFormValue): SingularFormValue =>
                        row.editing
                            ? {
                                  ...row,
                                  data: {
                                      ...row.data,
                                      ...value,
                                  },
                                  editing: false,
                              }
                            : row,
                ),
                adding: false,
            });
        };

        const cancel = (): void =>
            patchState(store, {
                rows: store
                    .rows()
                    .slice(
                        0,
                        store.adding() ? store.rows().length - 1 : Infinity,
                    )
                    .map(
                        (row: SingularFormValue): SingularFormValue => ({
                            ...row,
                            editing: false,
                        }),
                    ),
                adding: false,
            });

        const addRow = (): void =>
            patchState(store, {
                rows: [
                    ...store.rows(),
                    {
                        data: store.ids().reduce(
                            (
                                data: SingularValue,
                                id: string,
                            ): SingularValue => ({
                                ...data,
                                [id]: null,
                            }),
                            {},
                        ),
                        editing: true,
                    },
                ],
                adding: true,
            });

        return {
            markAsReactive,

            setRowScheme,
            setRowValidators,
            setData,
            setDisabled,
            setEnumerate,
            setCompact,

            getOptionLabel,
            getAvailableOptions,
            editRow,
            deleteRow,
            saveRow,
            cancel,
            addRow,
        };
    }),
);
