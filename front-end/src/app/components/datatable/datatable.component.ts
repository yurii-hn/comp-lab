import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
    ControlValueAccessor,
    FormControl,
    FormGroup,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator,
} from '@angular/forms';
import { MatTable } from '@angular/material/table';
import { ColumnInputType, IColumnScheme, IRow, IRowData, ISelectColumnScheme } from '@core/types/datatable';

type OnChangeFn = (value: IRowData[]) => void;
type BoundedOnChangeFn = () => void;
type OnTouchedFn = () => void;

@Component({
    selector: 'app-datatable',
    templateUrl: './datatable.component.html',
    styleUrls: ['./datatable.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: DatatableComponent,
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: DatatableComponent,
            multi: true,
        },
    ],
})
export class DatatableComponent
    implements OnInit, ControlValueAccessor, Validator
{
    public isAddingRow: boolean = false;
    public isCurrentlyEditing: boolean = false;

    public rowsData: IRow[] = [];

    public readonly rowFormGroup: FormGroup = new FormGroup({});

    private maxRowsCount!: number;
    private isDisabled: boolean = false;

    private onChange!: BoundedOnChangeFn;
    private onTouched!: OnTouchedFn;

    private readonly columnsAvailableOptionsMap: Map<string, string[]> =
        new Map();

    @Input() public columnsSchemes: IColumnScheme[] = [];
    @Input() public enumerateRows: boolean = false;

    @ViewChild(MatTable) public table!: MatTable<IRow>;

    public get columnIdsToDisplay(): string[] {
        const columnsToDisplay: string[] = [];

        const providedColumns: string[] = this.columnsSchemes.map(
            (column: IColumnScheme): string => column.id
        );

        if (this.enumerateRows) {
            columnsToDisplay.push('index');
        }

        columnsToDisplay.push(...providedColumns);

        columnsToDisplay.push('placeholder');

        if (!this.isDisabled) {
            columnsToDisplay.push('actions');
        }

        return columnsToDisplay;
    }

    public get isRowEditingDisabled(): boolean {
        return this.isCurrentlyEditing;
    }

    public get isRowEditingVisible(): boolean {
        const isAnyColumnEditable: boolean = this.columnsSchemes.some(
            (columnScheme: IColumnScheme): boolean => !!columnScheme.editable
        );

        return isAnyColumnEditable;
    }

    public get isRowDeletingDisabled(): boolean {
        return this.isCurrentlyEditing;
    }

    public get isRowSavingDisabled(): boolean {
        return !this.rowFormGroup.valid;
    }

    public get isAddRowDisabled(): boolean {
        return this.isCurrentlyEditing;
    }

    public get isAddRowVisible(): boolean {
        return this.rowsData.length < this.maxRowsCount;
    }

    public ngOnInit(): void {
        this.initMaxRowsCount();

        this.updateColumnsAvailableOptionsMap();

        this.initFormGroup();
    }

    public writeValue(value: IRowData[] | null): void {
        this.setRowsData(value || []);

        this.updateColumnsAvailableOptionsMap();
    }

    public registerOnChange(onChange: OnChangeFn): void {
        this.onChange = (): void => {
            onChange(this.getRowsDataExport());
        };
    }

    public registerOnTouched(onTouched: OnTouchedFn): void {
        this.onTouched = onTouched;
    }

    public setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    public validate(): ValidationErrors | null {
        if (!this.isCurrentlyEditing) {
            return null;
        }

        return {
            unsavedChanges: true,
        };
    }

    public getColumnAvailableOptions(columnId: string): string[] {
        return this.columnsAvailableOptionsMap.get(columnId) || [];
    }

    public getFormControlErrors(columnId: string): string[] {
        const formControl: FormControl = this.rowFormGroup.get(
            columnId
        ) as FormControl;

        const errors: ValidationErrors | null = formControl.errors;

        return errors ? Object.keys(errors) : [];
    }

    public onRowDataEdit(rowData: IRow): void {
        this.rowFormGroup.patchValue(rowData);

        this.isCurrentlyEditing = true;
        rowData.isEditing = true;

        this.onTouched();
        this.onChange();
    }

    public onRowDataDelete(rowIndex: number): void {
        this.rowsData.splice(rowIndex, 1);

        this.updateColumnsAvailableOptionsMap();

        this.onTouched();
        this.onChange();
        this.table.renderRows();
    }

    public onRowDataSave(rowData: IRow): void {
        this.columnsSchemes.forEach((columnScheme: IColumnScheme): void => {
            if (!columnScheme.editable && !this.isAddingRow) {
                return;
            }

            let formValue: any = this.rowFormGroup.get(columnScheme.id)?.value;

            switch (columnScheme.inputType) {
                case ColumnInputType.Number:
                    formValue = parseFloat(formValue);

                    break;
            }

            rowData[columnScheme.id] = formValue;
        });

        this.rowFormGroup.reset();

        this.isCurrentlyEditing = false;
        rowData.isEditing = false;

        if (this.isAddingRow) {
            this.isAddingRow = false;

            this.updateColumnsAvailableOptionsMap();

            this.setDisabledStateForNonEditableColumnsControls();
        }

        this.onTouched();
        this.onChange();
    }

    public onRowDataCancel(rowData: IRow): void {
        this.rowFormGroup.reset();

        this.isCurrentlyEditing = false;
        rowData.isEditing = false;

        if (this.isAddingRow) {
            this.isAddingRow = false;

            this.setDisabledStateForNonEditableColumnsControls();

            this.rowsData.pop();
            this.table.renderRows();
        }

        this.onTouched();
        this.onChange();
    }

    public onRowAdd(): void {
        this.isCurrentlyEditing = true;
        this.isAddingRow = true;

        this.onChange();

        const newRow: IRow = this.getEmptyRow();

        newRow.isEditing = true;

        this.setDisabledStateForNonEditableColumnsControls(false);

        this.rowsData.push(newRow);
        this.table.renderRows();
    }

    private initMaxRowsCount(): void {
        const selectColumnsOptionsCount: number[] = this.columnsSchemes
            .filter(
                (
                    columnScheme: IColumnScheme
                ): columnScheme is ISelectColumnScheme =>
                    columnScheme.inputType === ColumnInputType.Select
            )
            .map(
                (columnScheme: ISelectColumnScheme): number =>
                    columnScheme.selectOptions.length
            );

        this.maxRowsCount =
            selectColumnsOptionsCount.length > 0
                ? Math.min(...selectColumnsOptionsCount)
                : Infinity;
    }

    private updateColumnsAvailableOptionsMap(): void {
        this.columnsSchemes.forEach((columnScheme: IColumnScheme): void => {
            if (columnScheme.inputType === ColumnInputType.Select) {
                const availableOptions: string[] =
                    columnScheme.selectOptions.filter(
                        (option: string): boolean =>
                            !this.rowsData.some(
                                (rowData: IRow): boolean =>
                                    option === rowData[columnScheme.id]
                            )
                    );

                this.columnsAvailableOptionsMap.set(
                    columnScheme.id,
                    availableOptions
                );
            }
        });
    }

    private initFormGroup(): void {
        this.columnsSchemes.forEach((columnScheme: IColumnScheme): void => {
            const formControl: FormControl = new FormControl(
                null,
                columnScheme.validationFns || []
            );

            if (!columnScheme.editable) {
                formControl.disable();
            }

            this.rowFormGroup.addControl(columnScheme.id, formControl);
        });
    }

    private setRowsData(data: IRowData[]): void {
        this.rowsData = data.map(
            (currentRowData: IRowData): IRow => ({
                ...currentRowData,
                isEditing: false,
            })
        );
    }

    private getRowsDataExport(): IRowData[] {
        return this.rowsData.map((currentRow: IRow): IRowData => {
            const rowData: IRowData = {
                ...currentRow,
            };

            delete rowData['isEditing'];

            return rowData;
        });
    }

    private setDisabledStateForNonEditableColumnsControls(
        disabled: boolean = true
    ): void {
        this.columnsSchemes.forEach((columnScheme: IColumnScheme): void => {
            if (!columnScheme.editable) {
                const formControl: FormControl = this.rowFormGroup.get(
                    columnScheme.id
                ) as FormControl;

                if (disabled) {
                    formControl.disable();

                    return;
                }

                formControl.enable();
            }
        });
    }

    private getEmptyRow(): IRow {
        return this.columnsSchemes.reduce(
            (newRow: IRow, columnScheme: IColumnScheme): IRow => ({
                ...newRow,
                [columnScheme.id]: null,
            }),
            {
                isEditing: true,
            }
        );
    }
}
