import { Component } from '@angular/core';
import {
    ControlValueAccessor,
    FormControl,
    FormGroup,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator,
    Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    ColumnInputType,
    IColumnScheme,
    IRowData,
} from '@core/types/datatable';
import { ICompartment, IConstant, IIntervention } from '@core/types/model';
import {
    IPISelectedConstant,
    IProcessingDialogPIValue,
    ISolution,
    ISolutionData,
} from '@core/types/processing';
import { IImportSolution } from '@core/types/results';
import { tap } from 'rxjs';
import { FilesService } from 'src/app/services/files.service';

import { ModelService } from 'src/app/services/model.service';

type OnChangeFn = (value: IProcessingDialogPIValue) => void;
type OnTouchedFn = (value: IProcessingDialogPIValue) => void;

@Component({
    selector: 'app-parameters-identification-parameters-input-panel',
    templateUrl:
        './parameters-identification-parameters-input-panel.component.html',
    styleUrls: [
        './parameters-identification-parameters-input-panel.component.scss',
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: ParametersIdentificationParametersInputPanelComponent,
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: ParametersIdentificationParametersInputPanelComponent,
            multi: true,
        },
    ],
})
export class ParametersIdentificationParametersInputPanelComponent
    implements ControlValueAccessor, Validator
{
    public readonly constantsColumnsScheme: IColumnScheme<IPISelectedConstant>[] =
        [
            {
                id: 'name',
                name: 'Name',
                inputType: ColumnInputType.Select,
                selectOptions: this.getConstantNames(),
                validationFns: [Validators.required],
            },
            {
                id: 'lowerBoundary',
                name: 'Lower boundary',
                inputType: ColumnInputType.Number,
                validationFns: [Validators.required],
                editable: true,
            },
            {
                id: 'value',
                name: 'Initial guess',
                inputType: ColumnInputType.Number,
                validationFns: [Validators.required],
                editable: true,
            },
            {
                id: 'upperBoundary',
                name: 'Upper boundary',
                inputType: ColumnInputType.Number,
                validationFns: [Validators.required],
                editable: true,
            },
        ];

    public solutionColumnsScheme: IColumnScheme<IRowData<number>>[] =
        this.getSolutionColumnsScheme();

    public readonly solutionFormControl: FormControl<IRowData<number>[]> =
        new FormControl<IRowData<number>[]>([]) as FormControl<
            IRowData<number>[]
        >;

    public readonly formGroup: FormGroup = new FormGroup({
        parameters: new FormGroup({
            selectedConstants: new FormControl<IPISelectedConstant[] | null>(
                null,
                [Validators.required]
            ),
            timeStep: new FormControl<number | null>(null, [
                Validators.required,
            ]),
        }),
        solution: new FormControl<ISolution | null>(null, [
            Validators.required,
        ]),
    });

    public constructor(
        private readonly modelService: ModelService,
        private readonly filesService: FilesService,
        private readonly snackBar: MatSnackBar
    ) {
        this.solutionFormControl.valueChanges
            .pipe(tap(this.onSolutionFormControlChange.bind(this)))
            .subscribe();
    }

    public writeValue(value: IProcessingDialogPIValue | null): void {
        this.formGroup.setValue(
            value ?? {
                parameters: {
                    selectedConstants: null,
                    timeStep: null,
                },
                solution: null,
            }
        );
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

            return;
        }

        this.formGroup.enable();
    }

    public validate(): ValidationErrors | null {
        return this.formGroup.valid ? null : { invalid: true };
    }

    public onSolutionImport(): void {
        this.filesService
            .readDataFromFile<IImportSolution>('.scs')
            .pipe(
                tap((solutionData: IImportSolution): void => {
                    this.solutionFormControl.setValue(
                        this.getSolutionDataFromImport(solutionData)
                    );

                    this.snackBar.open('Imported successfully', 'Dismiss', {
                        panelClass: 'snackbar',
                        horizontalPosition: 'right',
                        verticalPosition: 'bottom',
                    });
                })
            )
            .subscribe();
    }

    private getConstantNames(): string[] {
        return this.modelService
            .getConstants()
            .map((constant: IConstant): string => constant.name);
    }

    private getSolutionColumnsScheme(): IColumnScheme<IRowData<number>>[] {
        const columnsScheme: IColumnScheme<IRowData<number>>[] = [];

        columnsScheme.push(
            ...this.modelService.getCompartments().map(
                (
                    compartment: ICompartment
                ): IColumnScheme<IRowData<number>> => ({
                    id: compartment.name,
                    name: compartment.name,
                    editable: true,
                    inputType: ColumnInputType.Number,
                    validationFns: [Validators.required],
                })
            )
        );

        columnsScheme.push(
            ...this.modelService.getInterventions().map(
                (
                    intervention: IIntervention
                ): IColumnScheme<IRowData<number>> => ({
                    id: intervention.name,
                    name: intervention.name,
                    editable: true,
                    inputType: ColumnInputType.Number,
                    validationFns: [Validators.required],
                })
            )
        );

        return columnsScheme;
    }

    private getSolutionDataFromImport(
        solutionData: IImportSolution
    ): IRowData<number>[] {
        return Array.from(
            { length: solutionData[0].values.length },
            (_: unknown, rowIndex: number): IRowData<number> =>
                solutionData.reduce(
                    (
                        rowData: IRowData<number>,
                        solution: ISolutionData
                    ): IRowData<number> => ({
                        ...rowData,
                        [solution.name]: solution.values[rowIndex],
                    }),
                    {}
                )
        );
    }

    private onSolutionFormControlChange(value: IRowData<number>[]): void {
        const compartmentsSolutionData: ISolutionData[] = this.modelService
            .getCompartments()
            .map(
                (compartment: ICompartment): ISolutionData => ({
                    name: compartment.name,
                    values: value.map(
                        (rowData: IRowData<number>): number =>
                            rowData[compartment.name]
                    ),
                })
            );

        const interventionsSolutionData: ISolutionData[] = this.modelService
            .getInterventions()
            .map(
                (intervention: IIntervention): ISolutionData => ({
                    name: intervention.name,
                    values: value.map(
                        (rowData: IRowData<number>): number =>
                            rowData[intervention.name]
                    ),
                })
            );

        this.formGroup.controls['solution']!.setValue({
            compartments: compartmentsSolutionData,
            ...(interventionsSolutionData.length && {
                interventions: interventionsSolutionData,
            }),
        });
    }
}
