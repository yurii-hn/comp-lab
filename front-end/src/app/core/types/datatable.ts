import { ValidatorFn } from '@angular/forms';

interface IColumnSchemeBase<RowDataType = any> {
    id: Extract<keyof RowDataType, string>;
    name: string;
    inputType: ColumnInputType;
    editable?: boolean;
    validationFns?: ValidatorFn[];
}

export function isColumnSchemeBase(
    columnSchemeBase: any
): columnSchemeBase is IColumnSchemeBase {
    const isKeysAmountValid: boolean =
        Object.keys(columnSchemeBase).length <= 5;
    const isIdValid: boolean =
        'id' in columnSchemeBase && typeof columnSchemeBase.id === 'string';
    const isNameValid: boolean =
        'name' in columnSchemeBase && typeof columnSchemeBase.name === 'string';
    const isInputTypeValid: boolean =
        'inputType' in columnSchemeBase &&
        isColumnInputType(columnSchemeBase.inputType);

    let isEditableValid: boolean = true;
    let isValidationFnsValid: boolean = true;

    if ('editable' in columnSchemeBase) {
        isEditableValid = typeof columnSchemeBase.editable === 'boolean';
    }

    if ('validationFns' in columnSchemeBase) {
        isValidationFnsValid =
            Array.isArray(columnSchemeBase.validationFns) &&
            columnSchemeBase.validationFns.every(
                (validationFn: any): boolean =>
                    typeof validationFn === 'function'
            );
    }

    return (
        isKeysAmountValid &&
        isIdValid &&
        isNameValid &&
        isInputTypeValid &&
        isEditableValid &&
        isValidationFnsValid
    );
}

export interface ITextColumnScheme<RowDataType = any>
    extends IColumnSchemeBase<RowDataType> {
    inputType: ColumnInputType.Text;
}

export function isTextColumnScheme(
    textColumnScheme: any
): textColumnScheme is ITextColumnScheme {
    const isColumnSchemeBaseValid: boolean =
        isColumnSchemeBase(textColumnScheme);
    const isInputTypeValid: boolean =
        textColumnScheme.inputType === ColumnInputType.Text;

    return isColumnSchemeBaseValid && isInputTypeValid;
}

export interface INumberColumnScheme<RowDataType = any>
    extends IColumnSchemeBase<RowDataType> {
    inputType: ColumnInputType.Number;
}

export function isNumberColumnScheme(
    numberColumnScheme: any
): numberColumnScheme is INumberColumnScheme {
    const isColumnSchemeBaseValid: boolean =
        isColumnSchemeBase(numberColumnScheme);
    const isInputTypeValid: boolean =
        numberColumnScheme.inputType === ColumnInputType.Number;

    return isColumnSchemeBaseValid && isInputTypeValid;
}

export interface ISelectColumnScheme<RowDataType = any>
    extends IColumnSchemeBase<RowDataType> {
    inputType: ColumnInputType.Select;
    selectOptions: string[];
}

export function isSelectColumnScheme(
    selectColumnScheme: any
): selectColumnScheme is ISelectColumnScheme {
    const isColumnSchemeBaseValid: boolean =
        isColumnSchemeBase(selectColumnScheme);
    const isInputTypeValid: boolean =
        selectColumnScheme.inputType === ColumnInputType.Select;
    const isSelectOptionsValid: boolean =
        'selectOptions' in selectColumnScheme &&
        Array.isArray(selectColumnScheme.selectOptions) &&
        selectColumnScheme.selectOptions.every(
            (selectOption: any): boolean => typeof selectOption === 'string'
        );

    return isColumnSchemeBaseValid && isInputTypeValid && isSelectOptionsValid;
}

export type IColumnScheme<RowDataType = any> =
    | ITextColumnScheme<RowDataType>
    | INumberColumnScheme<RowDataType>
    | ISelectColumnScheme<RowDataType>;

export function isColumnScheme(
    columnScheme: any
): columnScheme is IColumnScheme {
    return (
        isTextColumnScheme(columnScheme) ||
        isNumberColumnScheme(columnScheme) ||
        isSelectColumnScheme(columnScheme)
    );
}

export interface IRowData<ValueType = any> {
    [key: string]: ValueType;
}

export function isRowData(rowData: any): rowData is IRowData {
    const isObjectValid: boolean = typeof rowData === 'object';
    const areKeysValid: boolean = Object.keys(rowData).every(
        (key: any): boolean => typeof key === 'string'
    );

    return isObjectValid && areKeysValid;
}

export interface IRow extends IRowData {
    isEditing: boolean;
}

export function isRow(row: any): row is IRow {
    const isObjectValid: boolean = typeof row === 'object';
    const areKeysValid: boolean = Object.keys(row).every(
        (key: any): boolean => typeof key === 'string'
    );
    const isIsEditingValid: boolean =
        'isEditing' in row && typeof row.isEditing === 'boolean';

    return isObjectValid && areKeysValid && isIsEditingValid;
}

export enum ColumnInputType {
    Text = 'text',
    Number = 'number',
    Select = 'select',
}

export function isColumnInputType(
    columnInputType: any
): columnInputType is ColumnInputType {
    return Object.values(ColumnInputType).includes(columnInputType);
}
